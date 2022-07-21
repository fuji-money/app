import { Asset, Contract, Ticker, UtxoWithBlindPrivKey } from './types'
import {
  detectProvider,
  MarinaProvider,
  Balance,
  Utxo,
  AddressInterface,
} from 'marina-provider'
import {
  alphaServerUrl,
  issuerPubKey,
  marinaFujiAccountID,
  marinaMainAccountID,
  oraclePubKey,
} from 'lib/constants'
import { synthAssetArtifact } from 'lib/artifacts'
import { getContractPayout } from 'lib/contracts'
import { numberToHexEncodedUint64LE, toSatoshi } from './utils'
import {
  networks,
  payments,
  Psbt,
  confidential,
  AssetHash,
  address,
} from 'liquidjs-lib'
import { postData } from './fetch'

async function getBalances(): Promise<Balance[]> {
  const marina = await getMarina()
  if (!marina) return []
  if (!(await marina.isEnabled())) return []
  return await marina.getBalances()
}

export async function getBalance(asset: Asset): Promise<number> {
  const assetHash = asset.id
  const balances = await getBalances()
  if (!balances) return 0
  const found = balances.find((a) => a.asset.assetHash === assetHash)
  if (!found) return 0
  return found.amount
}

export async function checkMarina(): Promise<boolean> {
  const marina = await getMarina()
  if (!marina) return false
  return await marina.isEnabled()
}

export async function getMarina(): Promise<MarinaProvider | undefined> {
  if (typeof window === 'undefined') return undefined
  try {
    return await detectProvider('marina')
  } catch {
    console.log('Please install Marina extension')
    return undefined
  }
}

export async function makeBorrowTx(contract: Contract) {
  console.log('makeBorrowTx contract', contract)

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
  const borrowAmount = toSatoshi(synthetic.quantity, synthetic.precision)
  const collateralAmount = toSatoshi(collateral.quantity, collateral.precision)

  // validate we have necessary utxo
  const collateralUtxos = selectCoinsWithBlindPrivKey(
    await marina.getCoins([marinaMainAccountID]),
    await marina.getAddresses([marinaMainAccountID]),
    collateral.id,
    collateralAmount,
  )
  if (collateralUtxos.length === 0) throw new Error('Not enough funds')
  console.log('collateralAmount', collateralAmount)
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
    borrowAmount,
    collateralAsset: collateral.id,
    collateralAmount,
    payoutAmount: getContractPayout(contract),
    oraclePk: `0x${oraclePk.slice(1).toString('hex')}`,
    issuerPk: `0x${issuerPk.slice(1).toString('hex')}`,
    issuerScriptProgram: `0x${issuer.output!.slice(2).toString('hex')}`,
    priceLevel: numberToHexEncodedUint64LE(Math.floor(contract.priceLevel)), // if value is lower than this, then liquidate
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
  const changeAmount = collateralUtxosAmount - collateralAmount - feeAmount
  psbt.addOutput({
    script: address.toOutputScript(changeAddress.confidentialAddress),
    value: confidential.satoshiToConfidentialValue(changeAmount),
    asset: AssetHash.fromHex(collateral.id, false).bytes,
    nonce: Buffer.alloc(0),
  })
  console.log('psbt', psbt)

  // propose contract to server
  contractParams.setupTimestamp = timestamp.toString()
  contractParams.priceLevel = Math.floor(contract.priceLevel).toString()
  const response = await proposeContract(
    psbt,
    contractParams,
    covenantAddress,
    changeAddress,
    borrowerAddress,
    collateralUtxos,
  )
  console.log('response from server', response)

  // sign and broadcast transaction
  const ptx = Psbt.fromBase64(response.partialTransaction)
  const signedPtx = await marina.signTransaction(ptx.toBase64())
  const finalPtx = Psbt.fromBase64(signedPtx)
  finalPtx.finalizeAllInputs()
  console.log('finalPtx', finalPtx)
  const rawHex = finalPtx.extractTransaction().toHex()
  console.log('rawHex', rawHex)
  const txid = await marina.broadcastTransaction(rawHex)
  console.log('txid', txid)
}

async function proposeContract(
  psbt: Psbt,
  contractParams: any,
  nextAddress: AddressInterface,
  changeAddress: AddressInterface,
  borrowerAddress: AddressInterface,
  collateralUtxos: UtxoWithBlindPrivKey[],
) {
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

function selectCoinsWithBlindPrivKey(
  utxos: UtxoWithBlindPrivKey[],
  addresses: AddressInterface[],
  asset: string,
  minAmount: number,
): UtxoWithBlindPrivKey[] {
  let totalValue = 0
  const selectedUtxos: Utxo[] = []

  // utils to get blinding private key for a coin/utxo
  const addressScript = (a: AddressInterface) =>
    address.toOutputScript(a.confidentialAddress).toString('hex')
  const utxoScript = (u: UtxoWithBlindPrivKey) =>
    u.prevout.script.toString('hex')
  const getUtxoBlindPrivKey = (u: Utxo) =>
    addresses.find((a) => addressScript(a) === utxoScript(u))
      ?.blindingPrivateKey

  // select coins and add blinding private key to them
  for (const utxo of utxos) {
    if (!utxo.value || !utxo.asset) continue
    if (utxo.asset === asset) {
      const blindPrivKey = getUtxoBlindPrivKey(utxo)
      if (!blindPrivKey) continue
      utxo.blindPrivKey = blindPrivKey
      selectedUtxos.push(utxo)
      totalValue += utxo.value
      if (totalValue >= minAmount) {
        return selectedUtxos
      }
    }
  }
  return []
}

export async function createFujiAccount(marina: MarinaProvider) {
  await marina.createAccount(marinaFujiAccountID)
  await marina.useAccount(marinaFujiAccountID)
  await marina.importTemplate({
    type: 'ionio-artifact',
    template: JSON.stringify(synthAssetArtifact),
  })
  await marina.useAccount(await mainAccountID(marina))
}

export async function fujiAccountMissing(
  marina: MarinaProvider,
): Promise<boolean> {
  const accountIDs = await marina.getAccountsIDs()
  return !accountIDs.includes(marinaFujiAccountID)
}

async function mainAccountID(marina: MarinaProvider): Promise<string> {
  const accountIDs = await marina.getAccountsIDs()
  return accountIDs[0]
}
