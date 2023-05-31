import Decimal from 'decimal.js'
import {
  AssetPair,
  TDEXMarket,
  TDEXMarketPrice,
  TDEXProvider,
  TDEXTradeType,
  isTDEXMarket,
  isTDEXMarketPrice,
} from './types'
import axios from 'axios'

/**
 * Get a list of markets from a given provider
 * @param provider
 * @returns an array of markets
 */
export async function fetchMarketsFromProvider(
  provider: TDEXProvider,
): Promise<TDEXMarket[]> {
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
    .filter(isTDEXMarket)
}

/**
 * Get the price for a given market
 * @param market
 * @returns an array of markets
 */
export async function getMarketPrice(
  market: TDEXMarket,
): Promise<TDEXMarketPrice | undefined> {
  const url = market.provider.endpoint + '/v2/market/price'
  const opt = { headers: { 'Content-Type': 'application/json' } }
  const res = (await axios.post(url, { market }, opt)).data
  return isTDEXMarketPrice(res) ? res : undefined
}

/**
 * Calculate total fees in a given market for a given pair
 * Note: percentageFee is represented in basis points (10^-4)
 * @param market
 * @param pair
 * @returns number
 */
function totalMarketFees(
  market: TDEXMarket,
  pair: AssetPair,
): number | undefined {
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
 * Find the best market for a given pair
 * @param markets
 * @param pair
 * @returns market
 */
export function getBestMarket(
  markets: TDEXMarket[],
  pair: AssetPair,
): TDEXMarket | undefined {
  const validMarkets = markets
    // find markets for this pair
    .filter(
      (market) =>
        (market.baseAsset === pair.from.id &&
          market.quoteAsset === pair.dest.id) ||
        (market.baseAsset === pair.dest.id &&
          market.quoteAsset === pair.from.id),
    )

  if (!validMarkets) return
  if (validMarkets.length === 1) return validMarkets[0]

  // if we reach this point, it means we have several matching markets,
  // so lets find the market with the best spot price
  const bestMarket = validMarkets.reduce((prev, curr) => {
    const prevSpotPrice = prev.price?.spotPrice ?? 0
    const currSpotPrice = curr.price?.spotPrice ?? 0
    return getTradeType(curr, pair) === TDEXTradeType.SELL
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

/**
 * Get trade type (SELL or BUY)
 * @param market
 * @param pair
 * @returns trade type
 */
export function getTradeType(
  market: TDEXMarket,
  pair: AssetPair,
): TDEXTradeType {
  return market.baseAsset === pair.from.id
    ? TDEXTradeType.SELL
    : TDEXTradeType.BUY
}
