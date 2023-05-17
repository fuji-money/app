import { NetworkString } from 'marina-provider'
import { fetchURL } from './fetch'
import { Investment, Stock } from './types'
import { factoryUrlMainnet, factoryUrlTestnet, oracleURL } from './constants'

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
  return await fetchURL(getFactoryUrl(network) + '/contracts/info')
}

export const getBTCvalue = async (): Promise<number> => {
  const data = await fetchURL(oracleURL)
  return data ? Number(data.lastPrice) : 0
}
