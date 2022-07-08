import { Ticker } from './types'
import { detectProvider, MarinaProvider, Balance, Utxo } from 'marina-provider'

export async function getBalances(): Promise<Balance[]> {
  const marina = await getMarina()
  if (!marina) return []
  if (!(await marina.isEnabled())) return []
  return await marina.getBalances()
}

export const getBalance = async (ticker: Ticker): Promise<number> => {
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
