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
  if (!contract.txid) return
  return await fetchURL(
    `${explorerURL(network)}/tx/${contract.txid}/outspend/0`,
  )
}

export const getTx = async (txid: string, network: NetworkString) =>
  await fetchURL(`${explorerURL(network)}/tx/${txid}`)
