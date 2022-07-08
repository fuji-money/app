import { Contract, Ticker } from './types'
import { detectProvider, MarinaProvider, Balance, Utxo } from 'marina-provider'
import { issuerPubKey, issuerScriptProgram, marinaAccountID, oraclePubKey } from 'lib/constants'
import { synthAssetArtifact} from 'lib/artifacts'
import { getContractPayout, getContractPriceLevel, numberToString } from './utils'

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
  if (!synthetic.quantity || !collateral.quantity) throw new Error('Invalid contract')
  // get next address
  const addr = await marina.getNextAddress({
    borrowAsset: synthetic.id,
    borrowAmount: synthetic.quantity,
    collateralAsset: collateral.id,
    collateralAmount: collateral.quantity,
    payoutAmount: getContractPayout(contract),
    oraclePk: oraclePubKey,
    issuerPk: issuerPubKey,
    issuerScriptProgram: issuerScriptProgram, // payment.p2wksh (issuerPubKey)
    priceLevel: getContractPriceLevel(contract), // if value is lower than this, then liquidate
    setupTimestamp: numberToString(Date.now()),
  })
}

export function coinSelect(
  utxos: Utxo[],
  asset: string,
  minAmount: number,
): Utxo {
  for (const utxo of utxos) {
    if (!utxo.value || !utxo.asset) continue;
    if (utxo.asset === asset) {
      if (utxo.value >= minAmount) {
        return utxo;
      }
    }
  }
  throw new Error(
    `No enough coins found for ${asset}. Do you have enough funds? Utxo wanted: ${minAmount}`
  );
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