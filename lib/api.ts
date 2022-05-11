import { fetchURL } from './fetch'
import { getBTCvalue } from './server'
import { Asset, Offer } from './types'

export async function fetchAsset(ticker: string): Promise<Asset> {
  const asset = await fetchURL(`/api/assets/${ticker}`)
  return asset
}

export async function fetchAssets(): Promise<Asset[]> {
  const value = await getBTCvalue()
  const assets = await fetchURL('/api/assets')
  assets.forEach((asset: Asset) => {
    if (asset.ticker === 'LBTC') asset.value = value
  })
  return assets
}

export async function fetchOffer(
  synthetic: string,
  collateral: string,
): Promise<Offer> {
  return await fetchURL(`/api/offers/${synthetic}/${collateral}`)
}

export async function fetchOffers(): Promise<Offer[]> {
  return await fetchURL('/api/offers')
}
