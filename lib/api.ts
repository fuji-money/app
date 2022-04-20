import { Asset, Offer } from './types'

export async function fetchURL(url: string) {
  const res = await fetch(url)
  const data = await res.json()
  return data
}

export async function fetchAsset(ticker: string): Promise<Asset> {
  return await fetchURL(`/api/assets/${ticker}`)
}

export async function fetchAssets(): Promise<Asset[]> {
  return await fetchURL('/api/assets')
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
