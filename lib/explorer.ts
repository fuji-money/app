import { NetworkString } from 'marina-provider'
import { fetchURL } from './fetch'
import { Contract } from './types'

export const explorerURL = (network: NetworkString) => {
  switch (network) {
    case 'regtest':
      return 'http://localhost:3001'
    case 'testnet':
      // return 'https://blockstream.info/liquidtestnet/api'
      return 'https://liquid.network/liquidtestnet/api'
    default:
      return 'https://liquid.network/api'
  }
}

export const electrumWebSocket = (network: NetworkString) => {
  switch (network) {
    case 'regtest':
      return 'http://localhost:3001' // TODO
    case 'testnet':
      return 'wss://esplora.blockstream.com/liquidtestnet/electrum-websocket/api'
    default:
      return 'wss://esplora.blockstream.com/liquid/electrum-websocket/api'
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
export const getTx = async (txid: string, network: NetworkString) =>
  await fetchURL(`${explorerURL(network)}/tx/${txid}`)
