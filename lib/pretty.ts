import { Asset } from './types'
import { fromSatoshis } from './utils'

// format numbers
export const prettyNumber = (num = 0, min = 2, max = 8): string => {
  if (num === 0) return '0'
  return new Intl.NumberFormat('en-us', {
    minimumFractionDigits: min,
    maximumFractionDigits: max,
  }).format(num)
}

// format asset
export const prettyAsset = (asset: Asset, min?: number, max?: number): string =>
  `${prettyQuantity(asset.quantity, min, max)} ${asset.ticker}`

// format amount (amount is quantity x value)
export const prettyAmount = (asset: Asset, balance?: number): string => {
  const amount = fromSatoshis(balance || asset.quantity)
  return `US$ ${prettyNumber(amount * asset.value)}`
}

export const prettyPriceLevel = (price = 0): string =>
  `${prettyNumber(price)} USD`

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
export const prettyQuantity = (qty = 0, min?: number, max?: number): string =>
  prettyNumber(fromSatoshis(qty), min, max)

// pretty expiration date
export const prettyExpirationDate = (timestamp = 0): string => {
  if (timestamp === 0) return 'Perpetual'
  return new Intl.DateTimeFormat('default', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(timestamp))
}

// pretty time to expiration
export const prettyTimeToExpiration = (timestamp = 0): string => {
  if (timestamp === 0) return ''
  let rest
  const now = Date.now()
  const delta = Math.floor((timestamp - now) / 1_000)
  const days = Math.floor(delta / (60 * 60 * 24))
  rest = delta - days * 60 * 60 * 24
  const hours = Math.floor(rest / (60 * 60))
  rest -= hours * 60 * 60
  const minutes = Math.floor(rest / 60)
  rest -= minutes * 60 // same as seconds
  if (delta > 60 * 60 * 24) return `${days}d : ${hours}h` // > 1 day
  if (delta > 60 * 60) return `${hours}h : ${minutes}m` // > 1 hour
  if (delta > 60) return `${minutes}m : ${rest}s` // > 1 minute
  return `${rest}s`
}
