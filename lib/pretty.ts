import { Asset, Contract, ContractState } from './types'

// format numbers
export const prettyNumber = (num = 0, min = 2, max = 8) => {
  return new Intl.NumberFormat('en-us', {
    minimumFractionDigits: min,
    maximumFractionDigits: max,
  }).format(num)
}

// format asset
export const prettyAsset = (asset: Asset) =>
  `${prettyNumber(asset.quantity)} ${asset.ticker}`

// format amount (amount is quantity x value)
export const prettyAmount = (asset: Asset) =>
  `US $${prettyNumber((asset.quantity || 0) * asset.value)}`

// show pretty ago time
export const prettyAgo = (timestamp: number): string => {
  const now = new Date().getSeconds()
  const delta = now - timestamp
  if (delta > 86_400) {
    const days = Math.floor(delta / 86_400)
    return `${days}d`
  }
  if (delta > 3_600) {
    const hours = Math.floor(delta / 3_600)
    return `${hours}h`
  }
  if (delta > 60) {
    const minutes = Math.floor(delta / 60)
    return `${minutes}m`
  }
  const seconds = delta
  return `${seconds}s`
}

// show pretty ratio
export const prettyRatio = (ratio: number): number =>
  parseFloat(ratio.toFixed(2))
