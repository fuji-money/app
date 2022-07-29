import { Asset } from './types'
import { fromSatoshis } from './utils'

// format numbers
export const prettyNumber = (num = 0, min = 2, max = 8): string => {
  return new Intl.NumberFormat('en-us', {
    minimumFractionDigits: min,
    maximumFractionDigits: max,
  }).format(num)
}

// format asset
export const prettyAsset = (asset: Asset): string =>
  `${prettyQuantity(asset)} ${asset.ticker}`

// format amount (amount is quantity x value)
export const prettyAmount = (asset: Asset): string =>
  `US$ ${prettyNumber(fromSatoshis(asset.quantity) * asset.value)}`

// show pretty ago time
export const prettyAgo = (timestamp: number): string => {
  const now = Date.now()
  const delta = Math.floor((now - timestamp) / 1_000)
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

// show pretty percentage - TODO
export const prettyPercentage = (number: number, min = 2, max = 2): string => {
  const num = Number(prettyNumber(number * 100, min, max))
  return `${num < 0 ? '🔻' : '🔥'} ${num} %`
}

// show pretty ratio
export const prettyRatio = (ratio: number): number =>
  parseFloat(ratio.toFixed(2))

// show asset quantity in unities
export const prettyQuantity = (asset: Asset, min?: number, max?: number): string =>
  prettyNumber(fromSatoshis(asset.quantity), min, max)
