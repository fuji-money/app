import { NetworkString } from 'marina-provider'
import { fetchURL } from './fetch'
import { Investment, Oracle, Stock } from './types'
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

export async function fetchConfig(network: NetworkString) {
  console.log('fetchConfig', network, getFactoryUrl(network))
  return await fetchURL(getFactoryUrl(network) + '/contracts/info')
}

export const getBTCvalue = async (oracle: Oracle): Promise<number> => {
  if (!oracle.url) return 0
  const data = await fetchURL(oracle.url)
  return data ? Number(data.lastPrice) : 0
}
