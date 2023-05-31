import { Asset } from 'lib/types'

export interface AssetPair {
  from: Asset
  dest: Asset
}

export interface TDEXMarket {
  provider: TDEXProvider
  baseAsset: string
  baseAmount?: string
  quoteAsset: string
  quoteAmount?: string
  percentageFee?: { baseAsset: string; quoteAsset: string }
  fixedFee?: { baseAsset: string; quoteAsset: string }
  price?: TDEXMarketPrice
}

export function isTDEXMarket(market: any): market is TDEXMarket {
  return (
    typeof market === 'object' &&
    typeof market.baseAsset === 'string' &&
    typeof market.quoteAsset === 'string'
  )
}

export interface TDEXProvider {
  name: string
  endpoint: string
}

export function isTDEXProvider(provider: any): provider is TDEXProvider {
  return (
    typeof provider === 'object' &&
    typeof provider.name === 'string' &&
    typeof provider.endpoint === 'string'
  )
}

export interface TDEXMarketPrice {
  spotPrice: number
  minTradableAmount: string
}

export function isTDEXMarketPrice(price: any): price is TDEXMarketPrice {
  return (
    typeof price === 'object' &&
    typeof price.spotPrice === 'number' &&
    typeof price.minTradableAmount === 'string'
  )
}

export enum TDEXTradeType {
  BUY = 0,
  SELL = 1,
}

export interface TDEXTradePreview {
  market: TDEXMarket
  type: TDEXTradeType
  amount?: string
  asset?: string
  feeAsset?: string
}

export interface TDEXTradePreviewResponse {
  amount: string
  asset: string
  fee: {
    percentageFee: { baseAsset: string; quoteAsset: string }
    fixedFee: { baseAsset: string; quoteAsset: string }
  }
  feeAmount: string
  feeAsset: string
  price: { basePrice: number; quotePrice: number }
}

export function isTDEXTradePreviewResponse(
  resp: any,
): resp is TDEXTradePreviewResponse {
  return (
    typeof resp === 'object' &&
    typeof resp.amount === 'string' &&
    typeof resp.asset === 'string' &&
    typeof resp.fee === 'object' &&
    typeof resp.fee.fixedFee.baseAsset === 'string' &&
    typeof resp.fee.fixedFee.quoteAsset === 'string' &&
    typeof resp.fee.percentageFee.baseAsset === 'string' &&
    typeof resp.fee.percentageFee.quoteAsset === 'string' &&
    typeof resp.feeAmount === 'string' &&
    typeof resp.feeAsset === 'string' &&
    typeof resp.price === 'object' &&
    typeof resp.price.basePrice === 'number' &&
    typeof resp.price.quotePrice === 'number'
  )
}
