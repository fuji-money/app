import axios from 'axios'
import {
  AssetPair,
  TDEXMarket,
  TDEXPreviewTradeRequest,
  TDEXPreviewTradeResponse,
  isTDEXPreviewTradeResponse,
} from './types'
import { getTradeType } from './market'
import { Asset, Contract } from 'lib/types'

interface fetchTradePreviewProps {
  asset: Asset
  feeAsset: Asset
  market: TDEXMarket
  pair: AssetPair
}

export async function fetchTradePreview({
  asset,
  feeAsset,
  market,
  pair,
}: fetchTradePreviewProps): Promise<TDEXPreviewTradeResponse[]> {
  const trade: TDEXPreviewTradeRequest = {
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
  return res.filter(isTDEXPreviewTradeResponse)
}

export const getExposure = async (
  contract: Contract,
  market?: TDEXMarket,
): Promise<number> => {
  if (market && contract.synthetic.quantity) {
    const { collateral, synthetic } = contract
    const preview = await fetchTradePreview({
      asset: synthetic,
      feeAsset: collateral,
      market,
      pair: {
        from: synthetic,
        dest: collateral,
      },
    })
    return Number(preview[0].amount) + collateral.quantity
  }
  return 0
}
