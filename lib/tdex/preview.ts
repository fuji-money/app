import axios from 'axios'
import {
  TDEXv2Market,
  TDEXv2PreviewTradeRequest,
  TDEXv2PreviewTradeResponse,
  TDEXv2TradeType,
  isTDEXv2PreviewTradeResponse,
} from './types'
import { Asset, Contract } from 'lib/types'
import { getTradeType } from './market'

const fetchTradePreview = async (
  asset: Asset,
  feeAsset: Asset,
  market: TDEXv2Market,
  type: TDEXv2TradeType,
): Promise<TDEXv2PreviewTradeResponse[]> => {
  const trade: TDEXv2PreviewTradeRequest = {
    amount: asset.quantity.toString(),
    asset: asset.id,
    feeAsset: feeAsset.id,
    market,
    type,
  }
  const url = market.provider.endpoint + '/v2/trade/preview'
  const opt = { headers: { 'Content-Type': 'application/json' } }
  const res = (await axios.post(url, trade, opt)).data.previews
  if (!Array.isArray(res)) throw new Error('Invalid trade/preview response')
  return res.filter(isTDEXv2PreviewTradeResponse)
}

export const tradePreview = async (
  asset: Asset,
  feeAsset: Asset,
  market: TDEXv2Market,
  type: TDEXv2TradeType,
): Promise<TDEXv2PreviewTradeResponse> => {
  const previews = await fetchTradePreview(asset, feeAsset, market, type)
  if (!previews || !previews[0]) throw new Error('Error on preview')
  console.log('preview', previews[0])
  return previews[0]
}

export const getExposure = async (
  contract: Contract,
  market?: TDEXv2Market,
): Promise<number> => {
  if (market && contract.synthetic.quantity) {
    const { collateral, synthetic } = contract
    const pair = { from: synthetic, dest: collateral }
    const type = getTradeType(market, pair)
    const [asset, feeAsset] = [synthetic, collateral]
    const preview = await tradePreview(asset, feeAsset, market, type)
    const amountToReceive = Number(preview.amount) - Number(preview.feeAmount)
    return amountToReceive + collateral.quantity
  }
  return 0
}
