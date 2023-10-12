import { ConfigResponseOracle, Oracle } from './types'

const knownOracles = [
  {
    domain: 'fuji.money',
    name: 'Fuji.Money',
  },
  {
    domain: 'bitcoinreserve.com',
    name: 'Bitcoin Reserve',
  },
]

export function populateOracle(responseOracle: ConfigResponseOracle): Oracle {
  const pubkey = responseOracle.xOnlyPublicKey
  const url = responseOracle.url
  const oracle = knownOracles.find(({ domain }) => url.match(domain))
  const name = oracle ? oracle.name : 'Unknown'
  return { name, pubkey, url }
}
