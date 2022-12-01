import { NetworkString } from 'marina-provider'
import { fetchURL } from './fetch'

const explorerURL = (network: NetworkString) => {
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

// get tx from explorer
export const getTx = async (txid: string, network: NetworkString) =>
  await fetchURL(`${explorerURL(network)}/tx/${txid}`)
