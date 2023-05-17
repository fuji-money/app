import { ConfigResponseOracle, Oracle } from './types'

const fuji: Oracle = {
  name: 'Fuji.Money',
  disabled: false,
}

const bitfinex: Oracle = {
  name: 'Bitfinex',
  disabled: true,
}

const blockstream: Oracle = {
  name: 'Blockstream',
  disabled: true,
}

export function populateOracle(responseOracle: ConfigResponseOracle): Oracle {
  const pubkey = responseOracle.xOnlyPublicKey
  return { ...fuji, pubkey, url: responseOracle.url }
}

export const getOtherOracles = () => [bitfinex, blockstream]
