import { NetworkString } from 'marina-provider'
import { fetchURL } from './fetch'
import { getAssetBalance, getBalances } from './marina'
import { Asset, Investment, Offer, Oracle, Stock } from './types'
import { assetExplorerUrlMainnet, assetExplorerUrlTestnet } from './constants'
import { fromSatoshis } from './utils'
import { TICKERS } from './server'

const mintLimitByTicker: Record<string, Record<NetworkString, number>> = {
  [TICKERS.fbmn]: {
    liquid: 0,
    regtest: 0,
    testnet: 0,
  },
  [TICKERS.fuji]: {
    liquid: 2100,
    regtest: 0,
    testnet: 0,
  },
  [TICKERS.lbtc]: {
    liquid: 0,
    regtest: 0,
    testnet: 0,
  },
  [TICKERS.usdt]: {
    liquid: 0,
    regtest: 0,
    testnet: 0,
  },
}

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
    asset.mint = {
      actual: await getAssetCirculation(asset, network),
      max: mintLimitByTicker[asset.ticker][network],
    } // TODO, replace with factory query
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

const getAssetCirculation = async (
  asset: Asset,
  network: NetworkString,
): Promise<number> => {
  if (!asset.id) return 0
  const assetExplorerUrl =
    network === 'liquid' ? assetExplorerUrlMainnet : assetExplorerUrlTestnet
  const data = await fetchURL(`${assetExplorerUrl}${asset.id}`)
  if (!data) return 0
  const { chain_stats, mempool_stats } = data
  const issued = chain_stats.issued_amount + mempool_stats.issued_amount
  const burned = chain_stats.burned_amount + mempool_stats.burned_amount
  return fromSatoshis(issued - burned, asset.precision)
}
