import { Contract, Ticker } from './types'
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
  oraclePubKey,
} from 'lib/constants'
import { synthAssetArtifact } from 'lib/artifacts'
import {
  getContractPayout,
  numberToHexEncodedUint64LE,
  toSatoshi,
} from './utils'
import {
  networks,
  payments,
  TxOutput,
  Psbt,
  confidential,
  AssetHash,
  address,
} from 'liquidjs-lib'
import { postData } from './fetch'

export async function getBalances(): Promise<Balance[]> {
  const marina = await getMarina()
  if (!marina) return []
  if (!(await marina.isEnabled())) return []
  return await marina.getBalances()
}

export async function getBalance(ticker: Ticker): Promise<number> {
  const balances = await getBalances()
  if (!balances) return 0
  const asset = balances.find((a) => a.asset.ticker === ticker)
  if (!asset) return 0
  return asset.amount
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
  // console.log('makeBorrowTx contract', contract)

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
  const borrowAmount = toSatoshi(synthetic.quantity)
  const collateralAmount = toSatoshi(collateral.quantity)

  // validate we have necessary utxo
  const collateralUtxo = coinSelect(
    await marina.getCoins(),
    collateral.id,
    collateral.quantity,
  )
  if (!collateralUtxo || !collateralUtxo.value)
    throw new Error('Not enough funds')

  // get next and change addresses
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
    priceLevel: numberToHexEncodedUint64LE(contract.priceLevel), // if value is lower than this, then liquidate
    setupTimestamp: numberToHexEncodedUint64LE(Date.now()),
  }
  // console.log('contractParams', contractParams)
  const nextAddress = await getNextCovenantAddress(marina, contractParams)
  const changeAddress = await marina.getNextChangeAddress()
  // console.log('nextAddress', nextAddress)
  // console.log('changeAddress', changeAddress)

  // build Psbt
  const psbt = new Psbt({ network })
  // add collateral input
  psbt.addInput({
    hash: collateralUtxo.txid,
    index: collateralUtxo.vout,
    witnessUtxo: collateralUtxo.prevout,
  })
  // add covenant in position 0
  psbt.addOutput({
    script: Buffer.from(nextAddress.confidentialAddress),
    value: confidential.satoshiToConfidentialValue(collateralAmount),
    asset: AssetHash.fromHex(collateral.id, false).bytes,
    nonce: Buffer.alloc(0),
  })
  // add change output
  const feeAmount = 500 // TODO
  const changeAmount = collateralUtxo.value - collateralAmount - feeAmount
  psbt.addOutput({
    script: Buffer.from(changeAddress.confidentialAddress),
    value: confidential.satoshiToConfidentialValue(changeAmount),
    asset: AssetHash.fromHex(collateral.id, false).bytes,
    nonce: Buffer.alloc(0),
  })
  // console.log('psbt', psbt)

  let ptx: Psbt
  const response = await proposeContract(
    psbt,
    contractParams,
    nextAddress,
    changeAddress,
  )
  try {
    ptx = Psbt.fromBase64(response.partialTransaction)
  } catch (err: any) {
    throw new Error(`invalid partial transaction`)
  }
  // console.log('ptx', ptx)
}

async function proposeContract(
  psbt: Psbt,
  contractParams: any,
  nextAddress: AddressInterface,
  changeAddress: AddressInterface,
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

  // build post body
  const body = {
    partialTransaction: psbt.toBase64(),
    borrowerAddress: nextAddress.confidentialAddress,
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
      borrowerPublicKey: nextAddress.publicKey,
      priceLevel,
      setupTimestamp,
    },
    blindingPrivKeyOfCollateralInputs: {
      0: nextAddress.blindingPrivateKey,
    },
    blindingPubKeyForCollateralChange: {
      1: address
        .fromConfidential(changeAddress.confidentialAddress!)
        .blindingKey.toString('hex'),
    },
  }

  // post and return
  return postData(`${alphaServerUrl}/contracts`, body)
}

export function coinSelect(
  utxos: Utxo[],
  asset: string,
  minAmount: number,
): Utxo | undefined {
  for (const utxo of utxos) {
    if (!utxo.value || !utxo.asset) continue
    if (utxo.asset === asset) {
      if (utxo.value >= minAmount) {
        return utxo
      }
    }
  }
  return undefined
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
  return accountIDs.includes(marinaFujiAccountID)
}

export async function mainAccountID(marina: MarinaProvider): Promise<string> {
  const accountIDs = await marina.getAccountsIDs()
  return accountIDs[0]
}

async function getNextCovenantAddress(
  marina: MarinaProvider,
  contractParams: any,
): Promise<AddressInterface> {
  await marina.useAccount(marinaFujiAccountID)
  const address = await marina.getNextAddress(contractParams)
  await marina.useAccount(await mainAccountID(marina))
  return address
}
