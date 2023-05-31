import axios from 'axios'
import {
  AssetPair,
  TDEXMarket,
  TDEXTradePreview,
  isTDEXTradePreviewResponse,
} from './types'
import { getTradeType } from './market'
import { Asset } from 'lib/types'

export async function fetchTradePreview(
  asset: Asset,
  market: TDEXMarket,
  pair: AssetPair,
) {
  const { dest, from } = pair
  const otherCoin = asset.id === from.id ? dest : from
  const type = getTradeType(market, pair)
  const trade: TDEXTradePreview = {
    amount: asset.quantity.toString(),
    asset: asset.id,
    feeAsset: otherCoin.id,
    market,
    type,
  }
  const url = market.provider.endpoint + '/v2/trade/preview'
  const opt = { headers: { 'Content-Type': 'application/json' } }
  const res = (await axios.post(url, trade, opt)).data.previews
  if (!Array.isArray(res)) throw new Error('Invalid trade/preview response')
  return res.filter(isTDEXTradePreviewResponse)
}
