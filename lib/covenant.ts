import { Contract, UtxoWithBlindPrivKey } from './types'
import { Utxo, AddressInterface } from 'marina-provider'
import {
  alphaServerUrl,
  issuerPubKey,
  marinaFujiAccountID,
  marinaMainAccountID,
  oraclePubKey,
} from 'lib/constants'
import { getContractPayout } from 'lib/contracts'
import { numberToHexEncodedUint64LE } from './utils'
import {
  networks,
  payments,
  Psbt,
  confidential,
  AssetHash,
  address,
} from 'liquidjs-lib'
import { postData } from './fetch'
import {
  createFujiAccount,
  fujiAccountMissing,
  getMarina,
  selectCoinsWithBlindPrivKey,
} from './marina'

interface PreparedBorrowTx {
  psbt: Psbt
  contractParams: any
  changeAddress: AddressInterface
  borrowerAddress: AddressInterface
  collateralUtxos: UtxoWithBlindPrivKey[]
}

export async function prepareBorrowTx(
  contract: Contract,
): Promise<PreparedBorrowTx> {
  console.log('prepareBorrowTx contract', contract)

  // check for marina
  const marina = await getMarina()
  if (!marina) throw new Error('Please install Marina')

  // check for marina account, create if doesn't exists
  if (await fujiAccountMissing(marina)) await createFujiAccount(marina)

  // validate contract
  const { collateral, synthetic } = contract
  if (!collateral.quantity)
    throw new Error('Invalid contract: no collateral quantity')
  if (!synthetic.quantity)
    throw new Error('Invalid contract: no synthetic quantity')
  if (!contract.priceLevel)
    throw new Error('Invalid contract: no contract priceLevel')

  // get amounts in satoshis
  const collateralAmount = collateral.quantity

  // validate we have necessary utxo
  const collateralUtxos = selectCoinsWithBlindPrivKey(
    await marina.getCoins([marinaMainAccountID]),
    await marina.getAddresses([marinaMainAccountID]),
    collateral.id,
    collateral.quantity,
  )
  if (collateralUtxos.length === 0) throw new Error('Not enough funds')
  console.log('collateralAmount', collateral.quantity)
  console.log('collateralUtxos', collateralUtxos)

  // get next and change addresses
  const timestamp = Date.now()
  const network = networks.testnet // TODO
  const issuer = payments.p2wpkh({
    pubkey: Buffer.from(issuerPubKey, 'hex'),
    network: network,
  })
  const oraclePk = Buffer.from(oraclePubKey, 'hex')
  const issuerPk = Buffer.from(issuerPubKey, 'hex')
  const contractParams = {
    borrowAsset: synthetic.id,
    borrowAmount: synthetic.quantity,
    collateralAsset: collateral.id,
    collateralAmount: collateral.quantity,
    payoutAmount: getContractPayout(contract),
    oraclePk: `0x${oraclePk.slice(1).toString('hex')}`,
    issuerPk: `0x${issuerPk.slice(1).toString('hex')}`,
    issuerScriptProgram: `0x${issuer.output!.slice(2).toString('hex')}`,
    priceLevel: numberToHexEncodedUint64LE(contract.priceLevel), // if value is lower than this, then liquidate
    setupTimestamp: numberToHexEncodedUint64LE(timestamp),
  }
  console.log('contractParams', contractParams)
  await marina.useAccount(marinaFujiAccountID)
  const covenantAddress = await marina.getNextAddress(contractParams)
  await marina.useAccount(marinaMainAccountID)
  const borrowerAddress = await marina.getNextAddress()
  const changeAddress = await marina.getNextChangeAddress()
  console.log('covenantAddress', covenantAddress)
  console.log('changeAddress', changeAddress)

  // build Psbt
  const psbt = new Psbt({ network })
  // add collateral inputs
  for (const utxo of collateralUtxos) {
    console.log('utxo')
    console.log(utxo.txid, utxo.vout, utxo.prevout)
    psbt.addInput({
      hash: utxo.txid,
      index: utxo.vout,
      witnessUtxo: utxo.prevout,
    })
  }
  // add covenant in position 0
  const covenantOutput = {
    script: address.toOutputScript(covenantAddress.confidentialAddress),
    value: confidential.satoshiToConfidentialValue(collateralAmount),
    asset: AssetHash.fromHex(collateral.id, false).bytes,
    nonce: Buffer.alloc(0),
  }
  console.log('covenantOutput', covenantOutput)
  psbt.addOutput(covenantOutput)
  // add change output
  const feeAmount = 500 // TODO
  const collateralUtxosAmount = collateralUtxos.reduce(
    (value, utxo) => value + (utxo.value || 0),
    0,
  )
  const changeAmount = collateralUtxosAmount - collateral.quantity - feeAmount
  psbt.addOutput({
    script: address.toOutputScript(changeAddress.confidentialAddress),
    value: confidential.satoshiToConfidentialValue(changeAmount),
    asset: AssetHash.fromHex(collateral.id, false).bytes,
    nonce: Buffer.alloc(0),
  })
  console.log('psbt', psbt)

  // these values have different type when speaking with server
  contractParams.setupTimestamp = timestamp.toString()
  contractParams.priceLevel = contract.priceLevel.toString()
  return {
    psbt,
    contractParams,
    changeAddress,
    borrowerAddress,
    collateralUtxos,
  }
}

export async function proposeBorrowContract({
  psbt,
  contractParams,
  changeAddress,
  borrowerAddress,
  collateralUtxos,
}: PreparedBorrowTx) {
  // deconstruct contractParams
  const {
    borrowAsset,
    borrowAmount,
    collateralAsset,
    collateralAmount,
    payoutAmount,
    oraclePk,
    issuerPk,
    issuerScriptProgram,
    priceLevel,
    setupTimestamp,
  } = contractParams

  // get blinding priv key for each confidential collateral utxo
  // if utxo is not confidential, we MUST NOT pass the blind priv key
  const blindingPrivKeyOfCollateralInputs: Record<number, string> = {}

  const utxoIsConfidential = (u: Utxo) =>
    u.prevout.rangeProof != null && u.prevout.rangeProof.length > 0

  collateralUtxos.forEach((utxo, idx) => {
    if (utxoIsConfidential(utxo)) {
      if (!utxo.blindPrivKey) throw new Error('Utxo without blindPrivKey')
      blindingPrivKeyOfCollateralInputs[idx] = utxo.blindPrivKey
    }
  })

  if (!borrowerAddress.publicKey) return

  // build post body
  const body = {
    partialTransaction: psbt.toBase64(),
    borrowerAddress: borrowerAddress.confidentialAddress,
    // anything is fine for now as attestation
    attestation: {
      message: '',
      messageHash: '',
      signature: '',
    },
    contractParams: {
      borrowAsset,
      borrowAmount,
      collateralAsset,
      collateralAmount,
      payoutAmount,
      issuerPublicKey: issuerPk,
      issuerScriptProgram,
      oraclePublicKey: oraclePk,
      borrowerPublicKey: '0x'.concat(borrowerAddress.publicKey.slice(2)),
      priceLevel,
      setupTimestamp,
    },
    blindingPrivKeyOfCollateralInputs,
    blindingPubKeyForCollateralChange: {
      1: address
        .fromConfidential(changeAddress.confidentialAddress!)
        .blindingKey.toString('hex'),
    },
  }

  console.log('body', body)
  // post and return
  return postData(`${alphaServerUrl}/contracts`, body)
}
