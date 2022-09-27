import { NetworkString } from 'marina-provider'
import { fetchURL } from './fetch'
import { Contract } from './types'
import { sleep } from './utils'

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

// get tx from explorer
// sometimes explorer still doesn't have the tx available, because
// is too fresh, so we retry a few moments later
export const getTx = async (txid: string, network: NetworkString) => {
  const url = `${explorerURL(network)}/tx/${txid}`
  try {
    return await fetchURL(url)
  } catch (_) {
    await sleep(1000) // wait one second
    return await fetchURL(url)
  }
}
