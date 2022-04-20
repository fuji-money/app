import { Asset, Ticker } from './types'

export const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function findAsset(ticker: Ticker, assets: Asset[]) {
  return assets?.find((asset: Asset) => asset.ticker === ticker)
}
