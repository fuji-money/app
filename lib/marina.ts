import { Contract, Ticker } from './types'
import { detectProvider, MarinaProvider, Balance, Utxo } from 'marina-provider'
import {
  issuerPubKey,
  issuerScriptProgram,
  marinaAccountID,
  oraclePubKey,
} from 'lib/constants'
import { synthAssetArtifact } from 'lib/artifacts'
import {
  getContractPayout,
  numberToString,
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
  // check for marina
  const marina = await getMarina()
  if (!marina) throw new Error('Please install Marina')
  // check for marina account, create if doesn't exists
  try {
    await marina.getAccountInfo(marinaAccountID)
  } catch {
    await bootstrapMarinaAccount(marina)
  }
  // validate contract
  const { collateral, synthetic } = contract
  if (!synthetic.quantity || !collateral.quantity || !contract.priceLevel)
    throw new Error('Invalid contract')
  const borrowAmount = toSatoshi(synthetic.quantity)
  const collateralAmount = toSatoshi(collateral.quantity)
  // validate we have necessary utxo
  const network = networks.testnet
  const lbtc = network.assetHash
  const collateralUtxo = coinSelect(
    await marina.getCoins(),
    lbtc,
    collateral.quantity,
  )
  if (!collateralUtxo || !collateralUtxo.value)
    throw new Error('Not enough funds')
  // get next address
  const nextAddress = await marina.getNextAddress({
    borrowAsset: synthetic.id,
    borrowAmount,
    collateralAsset: collateral.id,
    collateralAmount,
    payoutAmount: getContractPayout(contract),
    oraclePk: oraclePubKey,
    issuerPk: issuerPubKey,
    issuerScriptProgram: issuerScriptProgram, // payment.p2wksh (issuerPubKey)
    priceLevel: contract.priceLevel, // if value is lower than this, then liquidate
    setupTimestamp: numberToString(Date.now()),
  })
  const changeAddress = await marina.getNextChangeAddress()
  // build Psbt
  const feeAmount = 500 // TODO
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
    asset: AssetHash.fromHex(network.assetHash, false).bytes,
    nonce: Buffer.alloc(0),
  })
  // add change output, already subtracted of the covenant amount and fee amount
  const changeAmount = collateralUtxo.value - collateralAmount - feeAmount
  psbt.addOutput({
    script: Buffer.from(changeAddress.confidentialAddress),
    value: confidential.satoshiToConfidentialValue(changeAmount),
    asset: AssetHash.fromHex(network.assetHash, false).bytes,
    nonce: Buffer.alloc(0),
  })
  console.log('nextAddress', nextAddress)
  console.log('psbt', psbt)
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

export async function bootstrapMarinaAccount(marina: MarinaProvider) {
  // create account 'fuji' on marina if doesn't exists
  try {
    await marina.getAccountInfo(marinaAccountID)
  } catch {
    await marina.createAccount(marinaAccountID)
  }
  // select 'fuji' account from marina
  await marina.useAccount(marinaAccountID)
  // import template (will throw error if already imported)
  try {
    await marina.importTemplate({
      type: 'ionio-artifact',
      template: JSON.stringify(synthAssetArtifact),
    })
  } catch {}
}
