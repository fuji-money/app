import { NetworkString } from 'marina-provider'
import { fetchURL } from './fetch'
import { getAssetBalance, getBalances } from './marina'
import { Asset, Investment, Offer, Oracle, Stock } from './types'

export async function fetchAsset(
  tickerOrId: string,
  network: NetworkString,
): Promise<Asset> {
  const asset = await fetchURL(`/api/${network}/assets/${tickerOrId}`)
  const balances = await getBalances()
  asset.quantity = getAssetBalance(asset, balances)
  return asset
}

export async function fetchAssets(network: NetworkString): Promise<Asset[]> {
  const assets = await fetchURL(`/api/${network}/assets`)
  const balances = await getBalances()
  const promises = assets.map(async (asset: Asset) => {
    asset.quantity = getAssetBalance(asset, balances)
    asset.mint = { actual: Math.random() * 4200, max: 4200 } // TODO, replace with factory query
    return asset
  })
  return Promise.all(promises)
}

export async function fetchInvestments(
  network: NetworkString,
): Promise<Investment[]> {
  return await fetchURL(`/api/${network}/investments`)
}

export async function fetchOffer(
  synthetic: string,
  collateral: string,
  network: NetworkString,
): Promise<Offer> {
  return await fetchURL(`/api/${network}/offers/${synthetic}/${collateral}`)
}

export async function fetchOffers(network: NetworkString): Promise<Offer[]> {
  return await fetchURL(`/api/${network}/offers`)
}

export async function fetchOracle(
  namePubkeyOrId: string,
  network: NetworkString,
): Promise<Oracle> {
  return await fetchURL(`/api/${network}/oracles/${namePubkeyOrId}`)
}

export async function fetchOracles(network: NetworkString): Promise<Oracle[]> {
  return await fetchURL(`/api/${network}/oracles`)
}

export async function fetchStocks(network: NetworkString): Promise<Stock[]> {
  return await fetchURL(`/api/${network}/stocks`)
}
