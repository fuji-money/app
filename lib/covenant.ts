import { Contract, UtxoWithBlindPrivKey } from './types'
import { Utxo, AddressInterface } from 'marina-provider'
import {
  alphaServerUrl,
  feeAmount,
  issuerPubKey,
  marinaFujiAccountID,
  marinaMainAccountID,
  oraclePubKey,
} from 'lib/constants'
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
import { synthAssetArtifact } from 'lib/artifacts'
import * as ecc from 'tiny-secp256k1';
import { Artifact, Contract as IonioContract } from '@ionio-lang/ionio';
import { getCollateralQuantity, getContractPayout } from './contracts'

interface PreparedBorrowTx {
  psbt: Psbt
  contractParams: any
  changeAddress: AddressInterface
  borrowerAddress: AddressInterface
  borrowerPublicKey: string
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
  const payoutAmount = contract.payoutAmount || getContractPayout(contract) // TODO

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
    payoutAmount,
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
  contractParams.priceLevel = contract.priceLevel.toString();
  return {
    psbt,
    contractParams,
    changeAddress,
    borrowerAddress,
    borrowerPublicKey: (covenantAddress as any).constructorParams.fuji,
    collateralUtxos,
  }
}

export async function proposeBorrowContract({
  psbt,
  contractParams,
  changeAddress,
  borrowerAddress,
  borrowerPublicKey,
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
      borrowerPublicKey,
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

export async function prepareRedeemTx(contract: Contract) {
  console.log('contract to redeem', contract)

  // check for marina
  const marina = await getMarina()
  if (!marina) throw new Error('Please install Marina')

  // validate contract
  const { collateral, synthetic } = contract
  if (!collateral.quantity)
    throw new Error('Invalid contract: no collateral quantity')
  if (!synthetic.quantity)
    throw new Error('Invalid contract: no synthetic quantity')
  if (!contract.priceLevel)
    throw new Error('Invalid contract: no contract priceLevel')

  // fee amount will be taken from covenant
  const payoutAmount = contract.payoutAmount || getContractPayout(contract) // TODO
  const network = networks.testnet // TODO

  // get ionio instance
  const params = contract.contractParams
  const constructorParams = [
    // borrow asset
    params.borrowAsset,
    // collateral asset
    params.collateralAsset,
    // borrow amount
    params.borrowAmount,
    // payout on redeem amount for issuer
    payoutAmount,
    // borrower public key
    contract.borrowerPubKey,
    // oracle public key
    params.oraclePk,
    // issuer public key
    params.issuerPk,
    // issuer output
    params.issuerScriptProgram, // segwit program
    // price level
    numberToHexEncodedUint64LE(params.priceLevel),
    // timestamp
    numberToHexEncodedUint64LE(params.setupTimestamp),
  ]
  console.log('constructorParams to ionio contract', constructorParams)
  const ionioInstance = new IonioContract(
    synthAssetArtifact as Artifact,
    constructorParams,
    network,
    ecc
  );
  ionioInstance.from(
    contract.txid!,
    0, // it should be 0, but best to store it TODO
    {
      script: ionioInstance.scriptPubKey,
      value: confidential.satoshiToConfidentialValue(contract.collateral.quantity!),
      asset: AssetHash.fromHex(contract.collateral.id, false).bytes,
      nonce: Buffer.alloc(0),
    }
  )
  console.log('ionioInstance', ionioInstance)

  // validate we have sufficient synthetic funds
  const syntheticUtxos = selectCoinsWithBlindPrivKey(
    await marina.getCoins([marinaMainAccountID]),
    await marina.getAddresses([marinaMainAccountID]),
    synthetic.id,
    synthetic.quantity,
  )
  if (syntheticUtxos.length === 0) throw new Error('Not enough synthetic funds')
  console.log('synthetic.quantity', synthetic.quantity)
  console.log('syntheticUtxos', syntheticUtxos)

  // calculate synthetic change amount
  const syntheticUtxosAmount = syntheticUtxos.reduce(
    (value, utxo) => value + (utxo.value || 0),
    0,
  )
  const syntheticChangeAmount = syntheticUtxosAmount - synthetic.quantity

  // get issuer address
  const issuer = payments.p2wpkh({
    pubkey: Buffer.from(issuerPubKey, 'hex'),
    network: network,
  })


  console.log('input covenant', contract.collateral.quantity)
  // get redeem transaction
  const marinaSigner = {
    signTransaction: async (base64: string) => await marina.signTransaction(base64)
  }
  const tx = ionioInstance.functions.redeem(marinaSigner)
  // add synthetic inputs
  // are these inputs confidential? if so, we need to pass the unblindData field of the coin
  // https://github.com/ionio-lang/ionio/blob/master/packages/ionio/test/e2e/transferWithKey.test.ts#L54
  for (const utxo of syntheticUtxos) {
    console.log('input synthetic utxo', utxo.value)
    const { txid, vout, prevout, unblindData } = utxo
    tx.withUtxo({txid, vout, prevout, unblindData})
  }
  // burn synthetic
  console.log('output op_return', synthetic.quantity)
  tx.withOpReturn(synthetic.quantity, synthetic.id)
  // payout to issuer
  console.log('output payout to issuer', payoutAmount)
  tx.withRecipient(issuer.address!, payoutAmount, collateral.id)
  // get collateral back
  const collateralAddress = await marina.getNextAddress()
  console.log('output collateral back', collateral.quantity - payoutAmount - feeAmount)
  tx.withRecipient(
    // address.fromConfidential(collateralAddress.confidentialAddress).unconfidentialAddress,
    collateralAddress.confidentialAddress,
    collateral.quantity - payoutAmount - feeAmount,
    collateral.id
  )
  // add synthetic change if any
  if (syntheticChangeAmount > 0) {
    const borrowChangeAddress = await marina.getNextChangeAddress()
    console.log('output synthetic change', syntheticChangeAmount)
    tx.withRecipient(borrowChangeAddress.confidentialAddress, syntheticChangeAmount, synthetic.id);
  }
  tx.withFeeOutput(feeAmount)
  console.log('redeem tx', tx)
  await tx.unlock()
  // you can access the psbt directly
  tx.psbt.finalizeAllInputs();
  const rawHex = tx.psbt.extractTransaction().toHex()
  console.log('rawHex', rawHex)
  const sentTransaction = await marina.broadcastTransaction(rawHex)
  console.log('txid', sentTransaction.txid)
  console.log('unlocked tx', tx)
  // return new Promise(resolve => setTimeout(resolve, 2000))
}