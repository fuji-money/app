import { fetchURL } from './fetch'
import { getAssetBalance, getBalances } from './marina'
import { Asset, Investment, Offer, Oracle, Stock } from './types'

export async function fetchAsset(tickerOrId: string): Promise<Asset> {
  const asset = await fetchURL(`/api/assets/${tickerOrId}`)
  const balances = await getBalances()
  asset.quantity = getAssetBalance(asset, balances)
  return asset
}

export async function fetchAssets(): Promise<Asset[]> {
  const assets = await fetchURL('/api/assets')
  const balances = await getBalances()
  const promises = assets.map(async (asset: Asset) => {
    asset.quantity = getAssetBalance(asset, balances)
    asset.mint = { actual: 15, max: 100 } // TODO, replace with factory query
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

export async function fetchOracle(namePubkeyOrId: string): Promise<Oracle> {
  return await fetchURL(`/api/oracles/${namePubkeyOrId}`)
}

export async function fetchOracles(): Promise<Oracle[]> {
  return await fetchURL('/api/oracles')
}

export async function fetchStocks(): Promise<Stock[]> {
  return await fetchURL('/api/stocks')
}
