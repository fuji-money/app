import { Ticker } from './types'
import { detectProvider, MarinaProvider, Balance } from 'marina-provider'

export async function getBalances(): Promise<Balance[]> {
  const marina = await getMarina()
  if (!marina) return []
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
