import axios from 'axios'
import {
  AssetPair,
  TDEXv2Market,
  TDEXv2PreviewTradeRequest,
  TDEXv2PreviewTradeResponse,
  isTDEXv2PreviewTradeResponse,
} from './types'
import { getTradeType } from './market'
import { Asset, Contract } from 'lib/types'

interface fetchTradePreviewProps {
  asset: Asset
  feeAsset: Asset
  market: TDEXv2Market
  pair: AssetPair
}

export async function fetchTradePreview({
  asset,
  feeAsset,
  market,
  pair,
}: fetchTradePreviewProps): Promise<TDEXv2PreviewTradeResponse[]> {
  const trade: TDEXv2PreviewTradeRequest = {
    amount: asset.quantity.toString(),
    asset: asset.id,
    feeAsset: feeAsset.id,
    market,
    type: getTradeType(market, pair),
  }
  const url = market.provider.endpoint + '/v2/trade/preview'
  const opt = { headers: { 'Content-Type': 'application/json' } }
  const res = (await axios.post(url, trade, opt)).data.previews
  if (!Array.isArray(res)) throw new Error('Invalid trade/preview response')
  return res.filter(isTDEXv2PreviewTradeResponse)
}

export const getExposure = async (
  contract: Contract,
  market?: TDEXv2Market,
): Promise<number> => {
  if (market && contract.synthetic.quantity) {
    const { collateral, synthetic } = contract
    const preview = (
      await fetchTradePreview({
        asset: synthetic,
        feeAsset: collateral,
        market,
        pair: {
          from: synthetic,
          dest: collateral,
        },
      })
    )[0]
    const amountToReceive = Number(preview.amount) - Number(preview.feeAmount)
    return amountToReceive + collateral.quantity
  }
  return 0
}
