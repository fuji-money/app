import { Asset } from './types'

// format numbers
export const prettyNumber = (num = 0, min = 2, max = 8): string => {
  return new Intl.NumberFormat('en-us', {
    minimumFractionDigits: min,
    maximumFractionDigits: max,
  }).format(num)
}

// format asset
export const prettyAsset = (asset: Asset): string =>
  `${prettyNumber(asset.quantity)} ${asset.ticker}`

// format amount (amount is quantity x value)
export const prettyAmount = (asset: Asset): string =>
  `US$ ${prettyNumber((asset.quantity || 0) * asset.value)}`

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

export const prettyPercentage = (number: number, min = 2, max = 2): string => {
  const num = Number(prettyNumber(number * 100, min, max))
  return `${num < 0 ? '🔻' : '🔥'} ${num} %`
}



// show pretty ratio
export const prettyRatio = (ratio: number): number =>
  parseFloat(ratio.toFixed(2))
