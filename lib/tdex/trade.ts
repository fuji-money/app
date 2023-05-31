import { AssetPair, TDEXMarket } from './types'
import { Utxo } from 'marina-provider'

export async function makeTrade(
  market: TDEXMarket,
  pair: AssetPair,
  utxos: Utxo[],
) {
  console.log('market', market)
  console.log('pair', pair)
  console.log('utxos', utxos)
  return 'faketxid'
}
