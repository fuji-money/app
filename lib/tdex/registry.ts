import { NetworkString } from 'marina-provider'
import { TDEXProvider, isTDEXProvider } from './types'
import axios from 'axios'

/**
 * Get tdex registry url based on network selected on Marina
 * @param network network name
 * @returns url
 */
function getRegistryURL(network: NetworkString): string {
  const Registries = {
    liquid:
      'https://raw.githubusercontent.com/tdex-network/tdex-registry/master/registry.json',
    testnet:
      'https://raw.githubusercontent.com/tdex-network/tdex-registry/testnet/registry.json',
    regtest: '',
  }
  return Registries[network] || Registries.liquid
}

/**
 * Get a list of registered providers from TDEX_REGISTRY_URL
 * @param network network name
 * @returns a list of providers
 */
export async function getProvidersFromRegistry(
  network: NetworkString = 'liquid',
): Promise<TDEXProvider[]> {
  // TODO: remove this after registry is updated
  if (network === 'testnet') {
    return [
      {
        name: 'v1.provider.tdex.network',
        endpoint: 'https://v1.provider.tdex.network',
      },
    ]
  }
  // end of TODO
  const res = (await axios.get(getRegistryURL(network))).data
  if (!Array.isArray(res)) throw new Error('Invalid registry response')
  return res.filter(isTDEXProvider)
}
