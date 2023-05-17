import { NetworkString } from 'marina-provider'
import { fUSDAssetId } from './constants'
import { Asset, ConfigResponseAsset } from './types'
import { networks } from 'liquidjs-lib'
import { fromSatoshis } from './utils'

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
  minCollateralRatio: 150,
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
  [fUSDAssetId]: { ...fuji, precision: 2 }, // mainnet
  '0d86b2f6a8c3b02a8c7c8836b83a081e68b7e2b4bcdfc58981fc5486f59f7518': fuji, // testnet
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
