import { NetworkString } from 'marina-provider'
import { fetchURL } from './fetch'
import { Contract } from './types'

export const explorerURL = (network: NetworkString) => {
  switch (network) {
    case 'regtest':
      return 'http://localhost:3001'
    case 'testnet':
      return 'https://liquid.network/liquidtestnet/api'
    default:
      return 'https://liquid.network/api'
  }
}

export const checkOutspend = async (
  contract: Contract,
  network: NetworkString,
) => {
  const { txid, vout } = contract
  if (!txid || typeof vout === 'undefined') return
  const url = `${explorerURL(network)}/tx/${txid}/outspend/${vout}`
  return await fetchURL(url)
}

export const getTx = async (txid: string, network: NetworkString) =>
  await fetchURL(`${explorerURL(network)}/tx/${txid}`)
