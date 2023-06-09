import { Asset } from 'lib/types'

export interface AssetPair {
  from: Asset
  dest: Asset
}

export interface TDEXv2Market {
  provider: TDEXv2Provider
  baseAsset: string
  baseAmount?: string
  quoteAsset: string
  quoteAmount?: string
  percentageFee?: { baseAsset: string; quoteAsset: string }
  fixedFee?: { baseAsset: string; quoteAsset: string }
  price?: TDEXv2MarketPrice
}

export function isTDEXv2Market(market: any): market is TDEXv2Market {
  return (
    typeof market === 'object' &&
    typeof market.baseAsset === 'string' &&
    typeof market.quoteAsset === 'string'
  )
}

export interface TDEXv2Provider {
  name: string
  endpoint: string
}

export function isTDEXv2Provider(provider: any): provider is TDEXv2Provider {
  return (
    typeof provider === 'object' &&
    typeof provider.name === 'string' &&
    typeof provider.endpoint === 'string'
  )
}

export interface TDEXv2MarketPrice {
  spotPrice: number
  minTradableAmount: string
}

export function isTDEXv2MarketPrice(price: any): price is TDEXv2MarketPrice {
  return (
    typeof price === 'object' &&
    typeof price.spotPrice === 'number' &&
    typeof price.minTradableAmount === 'string'
  )
}

export enum TDEXv2TradeType {
  BUY = 0,
  SELL = 1,
}

export interface TDEXv2PreviewTradeRequest {
  market: TDEXv2Market
  type: TDEXv2TradeType
  amount?: string
  asset?: string
  feeAsset?: string
}

export interface TDEXv2PreviewTradeResponse {
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

export function isTDEXv2PreviewTradeResponse(
  resp: any,
): resp is TDEXv2PreviewTradeResponse {
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

export interface TDEXv2UnblindedInput {
  index: number
  asset: string
  amount: string
  assetBlinder: string
  amountBlinder: string
}

export interface TDEXv2SwapRequest {
  id: string
  amountP: string
  assetP: string
  amountR: string
  assetR: string
  transaction: string
  unblindedInputs: TDEXv2UnblindedInput[]
}

export interface TDEXv2ProposeTradeRequest {
  feeAmount: string
  feeAsset: string
  market: Pick<TDEXv2Market, 'baseAsset' | 'quoteAsset'>
  swapRequest: TDEXv2SwapRequest
  type: TDEXv2TradeType
}

export interface TDEXv2SwapAccept {
  id: string
  requestId: string
  transaction: string
  unblindedInputs: TDEXv2UnblindedInput[]
}

export interface TDEXv2SwapFail {
  id: string
  messageId: string
  failureCode: number
  failureMessage: string
}

export interface TDEXv2ProposeTradeResponse {
  swapAccept: TDEXv2SwapAccept
  swapFail: TDEXv2SwapFail
  expiryTimeUnix: string
}

export interface TDEXv2CompleteTradeRequest {
  id: string
  acceptId: string
  transaction: string
}

export interface TDEXv2CompleteTradeResponse {
  txid: string
  swapFail: TDEXv2SwapFail
}
