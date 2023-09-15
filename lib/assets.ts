import { NetworkString } from 'marina-provider'
import { assetExplorerUrlMainnet, assetExplorerUrlTestnet } from './constants'
import { Asset, ConfigResponseAsset } from './types'
import { networks } from 'liquidjs-lib'
import { fromSatoshis } from './utils'
import { fetchURL } from './fetch'

export enum TICKERS {
  fbmn = 'FBMN',
  fuji = 'FUSD',
  lbtc = 'L-BTC',
  usdt = 'USDt',
}

const lbtc: Asset = {
  icon: '/images/assets/lbtc.svg',
  id: '',
  isSynthetic: false,
  isAvailable: false,
  name: 'Liquid BTC',
  precision: 8,
  quantity: 0,
  ticker: TICKERS.lbtc,
  value: 40000,
}

const usdt: Asset = {
  icon: '/images/assets/usdt.svg',
  id: '',
  isSynthetic: false,
  isAvailable: false,
  name: 'Tether USD',
  precision: 8,
  quantity: 0,
  minCollateralRatio: 150,
  ticker: TICKERS.usdt,
  value: 1,
}

const fuji: Asset = {
  icon: '/images/assets/fusd.svg',
  id: '',
  isSynthetic: true,
  isAvailable: true,
  name: 'FUJI USD',
  precision: 8,
  quantity: 0,
  ticker: TICKERS.fuji,
  value: 1,
}

const assetById: Record<string, Asset> = {
  '0dea022a8a25abb128b42b0f8e98532bc8bd74f8a77dc81251afcc13168acef7': {
    ...fuji,
    precision: 2,
  }, // (FUSD) mainnet
  '518c0b351f5731f5d40cf6ad444d1c147eda1cdf8c867185c58a526fb02ad806': {
    ...fuji,
    precision: 2,
  }, // (TEST-FUSD) mainnet
  '0d86b2f6a8c3b02a8c7c8836b83a081e68b7e2b4bcdfc58981fc5486f59f7518': fuji, // (FUSD) testnet
  '6f0279e9ed041c3d710a9f57d0c02928416460c4b722ae3457a11eec381c526d': lbtc, // mainnet
  '144c654344aa716d6f3abcc1ca90e5641e4e2a7f633bc09fe3baf64585819a49': lbtc, // testnet
  ce091c998b83c78bb71a632313ba3760f1763d9cfcffae02258ffa9865a37bd2: usdt, // mainnet
  f3d1ec678811398cd2ae277cbe3849c6f6dbd72c74bc542f7c4b11ff0e820958: usdt, // testnet
}

export function populateAsset(responseAsset: ConfigResponseAsset): Asset {
  const { assetID, maxCirculatingSupply, minCollateralRatio } = responseAsset
  const asset = assetById[assetID]
  if (!asset) throw new Error(`Unknown asset id from config: ${assetID}`)
  const supply =
    maxCirculatingSupply === -1
      ? undefined
      : fromSatoshis(maxCirculatingSupply, asset.precision)
  return {
    ...asset,
    id: assetID,
    minCollateralRatio,
    maxCirculatingSupply: supply,
  }
}

export function getLBTC(network: NetworkString): Asset {
  const id = networks[network].assetHash
  const asset = assetById[id]
  return { ...asset, id }
}

export async function getAssetCirculation(
  asset: Asset,
  network: NetworkString,
): Promise<number> {
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
