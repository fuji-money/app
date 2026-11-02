import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react'
import { Config, ConfigResponse } from 'lib/types'
import { WalletContext } from './wallet'
import { fetchConfig, getBTCvalue } from 'lib/api'
import { openModal } from 'lib/utils'
import {
  getAssetCirculation,
  getLBTC,
  populateAsset,
  TICKERS,
} from 'lib/assets'
import { populateOffer } from 'lib/offers'
import { populateOracle } from 'lib/oracles'
import { ModalIds } from 'components/modals/modal'
import { ArtifactRepository, StaticArtifactRepository } from 'lib/artifact.port'
import { NetworkString } from 'marina-provider'
import {
  getFallbackConfig,
  readCachedFactoryConfig,
  writeCachedFactoryConfig,
} from 'lib/fallbackConfig'

interface ConfigContextProps {
  artifactRepo: ArtifactRepository
  config: Config
  factoryOffline: boolean
  loading: boolean
  reloadConfig: () => void
}

const artifactRepo = new StaticArtifactRepository()

const emptyConfig = {
  assets: [],
  offers: [],
  oracles: [],
  xOnlyTreasuryPublicKey: '',
}

export const ConfigContext = createContext<ConfigContextProps>({
  artifactRepo,
  config: emptyConfig,
  factoryOffline: false,
  loading: true,
  reloadConfig: () => {},
})

async function toAppConfig(
  response: ConfigResponse,
  network: NetworkString,
): Promise<Config> {
  const oracles = response.oracles.map((oracle) => populateOracle(oracle))
  const assets = response.assets
    .map((asset) => populateAsset(asset))
    .concat(getLBTC(network))

  for (const asset of assets) {
    if (asset.ticker === TICKERS.lbtc)
      asset.value = await getBTCvalue(oracles[0])
    if (asset.maxCirculatingSupply) {
      asset.circulating = await getAssetCirculation(asset, network)
    }
  }

  return {
    assets,
    offers: response.offers.map((offer) =>
      populateOffer(offer, assets, oracles),
    ),
    oracles,
    xOnlyTreasuryPublicKey: response.xOnlyIssuerPublicKey,
  }
}

export const ConfigProvider = ({ children }: { children: ReactNode }) => {
  const { network } = useContext(WalletContext)
  const [config, setConfig] = useState<Config>(emptyConfig)
  const [factoryOffline, setFactoryOffline] = useState(false)
  const [loading, setLoading] = useState(true)

  const reloadConfig = async () => {
    if (!network) {
      setLoading(false)
      return
    }

    const remote = await fetchConfig(network)
    const candidates = [
      remote,
      readCachedFactoryConfig(network),
      getFallbackConfig(network),
    ].filter((candidate): candidate is ConfigResponse => Boolean(candidate))

    for (const candidate of candidates) {
      try {
        const next = await toAppConfig(candidate, network)
        const live = Boolean(remote) && candidate === remote
        if (live) {
          writeCachedFactoryConfig(network, remote as ConfigResponse)
          for (const asset of next.assets) {
            if (
              asset.maxCirculatingSupply &&
              asset.maxCirculatingSupply === asset.circulating
            )
              openModal(ModalIds.MintLimit)
          }
        }
        setConfig(next)
        setFactoryOffline(!live)
        setLoading(false)
        return
      } catch (error) {
        console.warn('Unable to use factory config', error)
      }
    }

    setFactoryOffline(true)
    setLoading(false)
  }

  useEffect(() => {
    if (network) reloadConfig()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [network])

  return (
    <ConfigContext.Provider
      value={{
        artifactRepo,
        config,
        factoryOffline,
        loading,
        reloadConfig,
      }}
    >
      {children}
    </ConfigContext.Provider>
  )
}
