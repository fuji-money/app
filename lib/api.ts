import { fetchURL } from './fetch'
import { getBalance } from './marina'
import { getBTCvalue } from './server'
import { Asset, Investment, Offer, Oracle, Stock } from './types'

export async function fetchAsset(ticker: string): Promise<Asset> {
  const asset = await fetchURL(`/api/assets/${ticker}`)
  if (asset.ticker === 'L-BTC') {
    asset.value = await getBTCvalue()
  }
  asset.quantity = await getBalance(asset)
  return asset
}

export async function fetchAssets(): Promise<Asset[]> {
  const value = await getBTCvalue()
  const assets = await fetchURL('/api/assets')
  const promises = assets.map(async (asset: Asset) => {
    if (asset.ticker === 'L-BTC') asset.value = value
    asset.quantity = await getBalance(asset)
    return asset
  })
  return Promise.all(promises)
}

export async function fetchInvestments(): Promise<Investment[]> {
  return await fetchURL('/api/investments')
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

export async function fetchOracles(): Promise<Oracle[]> {
  return await fetchURL('/api/oracles')
}

export async function fetchStocks(): Promise<Stock[]> {
  return await fetchURL('/api/stocks')
}
