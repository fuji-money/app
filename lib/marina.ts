import { Ticker } from './types'
import { detectProvider, MarinaProvider } from 'marina-provider'

export const getBalance = (ticker: Ticker): number => {
  switch (ticker) {
    case 'LBTC':
      return 2
    case 'USDt':
      return 42_000
    case 'fUSD':
      return 4_200
    case 'fBMN':
      return 0.001
    default:
      return 0
  }
}

export async function checkMarina(): Promise<boolean> {
  const marina = await getMarina()
  if (!marina) return false
  return await marina.isEnabled()
}

export async function getMarina(): Promise<MarinaProvider | undefined> {
  try {
    return await detectProvider('marina')
  } catch {
    console.log('Please install Marina extension')
    return undefined
  }
}
