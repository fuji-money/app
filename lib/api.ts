import { NetworkString } from 'marina-provider'
import { fetchURL } from './fetch'
import { ConfigResponse, Investment, Oracle, Stock } from './types'
import { factoryUrlMainnet, factoryUrlTestnet } from './constants'

export async function fetchInvestments(
  network: NetworkString,
): Promise<Investment[]> {
  return await fetchURL(`/api/${network}/investments`)
}

export async function fetchStocks(network: NetworkString): Promise<Stock[]> {
  return await fetchURL(`/api/${network}/stocks`)
}

export function getFactoryUrl(network: NetworkString) {
  return network === 'liquid' ? factoryUrlMainnet : factoryUrlTestnet
}

export async function fetchConfig(
  network: NetworkString,
): Promise<ConfigResponse | undefined> {
  // Fail fast. A dead factory hangs the contract list, which blocks redeem.
  return fetchURL(getFactoryUrl(network) + '/contracts/info', 8000)
}

// Public price used when the Fuji oracle host is down. Redeem does not spend
// this number; it only keeps the on-screen ratio from being marked liquidated
// because of a missing price. Mempool sends Access-Control-Allow-Origin: *.
const publicBtcPriceUrl = 'https://mempool.space/api/v1/prices'

export const getBTCvalue = async (oracle?: Oracle): Promise<number> => {
  if (oracle?.url) {
    const data = await fetchURL(
      `${oracle.url.replace(/\/$/, '')}/oracle/BTCUSD`,
      4000,
    )
    const oraclePrice = Number(data?.lastPrice)
    if (oraclePrice > 0) return oraclePrice
  }
  const prices = await fetchURL(publicBtcPriceUrl, 8000)
  const usd = Number(prices?.USD)
  return usd > 0 ? usd : 0
}
