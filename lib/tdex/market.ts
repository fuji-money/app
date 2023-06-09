import Decimal from 'decimal.js'
import {
  AssetPair,
  TDEXv2Market,
  TDEXv2MarketPrice,
  TDEXv2Provider,
  TDEXv2TradeType,
  isTDEXv2Market,
  isTDEXv2MarketPrice,
} from './types'
import axios from 'axios'
import { getProvidersFromRegistry } from './registry'
import { NetworkString } from 'marina-provider'

/**
 * Get a list of markets from a given provider
 * @param provider
 * @returns an array of markets
 */
export async function fetchMarketsFromProvider(
  provider: TDEXv2Provider,
): Promise<TDEXv2Market[]> {
  const url = provider.endpoint + '/v2/markets'
  const opt = { headers: { 'Content-Type': 'application/json' } }
  const res = (await axios.post(url, {}, opt)).data.markets
  if (!Array.isArray(res)) throw new Error('Invalid markets response')
  return res
    .map((m: any) => ({
      provider,
      baseAsset: m.market.baseAsset,
      quoteAsset: m.market.quoteAsset,
      percentageFee: m.fee.percentageFee,
      fixedFee: m.fee.fixedFee,
    }))
    .filter(isTDEXv2Market)
}

/**
 * Get the price for a given market
 * @param market
 * @returns an array of markets
 */
const getMarketPrice = async (
  market: TDEXv2Market,
): Promise<TDEXv2MarketPrice | undefined> => {
  const url = market.provider.endpoint + '/v2/market/price'
  const opt = { headers: { 'Content-Type': 'application/json' } }
  const res = (await axios.post(url, { market }, opt)).data
  return isTDEXv2MarketPrice(res) ? res : undefined
}

/**
 * Calculate total fees in a given market for a given pair
 * Note: percentageFee is represented in basis points (10^-4)
 * @param market
 * @param pair
 * @returns number
 */
const totalMarketFees = (
  market: TDEXv2Market,
  pair: AssetPair,
): number | undefined => {
  // return undefined if market has no price
  if (typeof market.fixedFee === 'undefined') return
  if (typeof market.percentageFee === 'undefined') return

  // calculate fees
  const fixedFees = Decimal.add(
    market.fixedFee.baseAsset,
    market.fixedFee.quoteAsset,
  )
  const percentageFees = {
    dest: Decimal.mul(
      pair.dest.quantity ?? 0,
      market.percentageFee.quoteAsset,
    ).div(10_000),
    from: Decimal.mul(
      pair.from.quantity ?? 0,
      market.percentageFee.baseAsset,
    ).div(10_000),
  }

  return Decimal.add(percentageFees.dest, percentageFees.from)
    .add(fixedFees)
    .toNumber()
}

/**
 * Get trade type (SELL or BUY)
 * @param market
 * @param pair
 * @returns trade type
 */
export const getTradeType = (
  market: TDEXv2Market,
  pair: AssetPair,
): TDEXv2TradeType => {
  return market.baseAsset === pair.from.id
    ? TDEXv2TradeType.SELL
    : TDEXv2TradeType.BUY
}

/**
 * Find best market for given asset pair
 * @param pair
 * @returns trade type
 */
export const findBestMarket = async (
  network: NetworkString,
  pair: AssetPair,
): Promise<TDEXv2Market | undefined> => {
  // filter market by pair
  const isPairMarket = (market: TDEXv2Market) =>
    (market.baseAsset === pair.from.id && market.quoteAsset === pair.dest.id) ||
    (market.baseAsset === pair.dest.id && market.quoteAsset === pair.from.id)

  // push all markets for this pair to validMarkets
  const validMarkets: TDEXv2Market[] = []
  for (const provider of await getProvidersFromRegistry(network)) {
    const providerMarkets = await fetchMarketsFromProvider(provider)
    const marketsForThisPair = providerMarkets.filter(isPairMarket)
    for (const market of marketsForThisPair) {
      const price = await getMarketPrice(market)
      validMarkets.push({ ...market, price })
    }
  }

  // check number of valid markets
  if (!validMarkets) return
  if (validMarkets.length === 1) return validMarkets[0]

  // if we reach this point, it means we have several matching markets,
  // so lets find the market with the best spot price
  const bestMarket = validMarkets.reduce((prev, curr) => {
    const prevSpotPrice = prev.price?.spotPrice ?? 0
    const currSpotPrice = curr.price?.spotPrice ?? 0
    return getTradeType(curr, pair) === TDEXv2TradeType.SELL
      ? // when selling base asset we want the lowest spot price
        prevSpotPrice < currSpotPrice
        ? prev
        : curr
      : // when buying base asset we want the highest spot price
      prevSpotPrice > currSpotPrice
      ? prev
      : curr
  }, validMarkets[0])

  // check if there are more then one market with same spot price
  // in that case, return the market with lowest fee
  const dups = validMarkets.filter(
    (m) => m.price?.spotPrice === bestMarket.price?.spotPrice,
  )
  if (dups.length > 1) {
    return dups.reduce((prev, curr) => {
      const prevFees = totalMarketFees(prev, pair)
      const currFees = totalMarketFees(curr, pair)
      if (!prevFees) return curr
      if (!currFees) return prev
      return prevFees < currFees ? prev : curr
    }, dups[0])
  }

  return bestMarket
}
