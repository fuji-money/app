import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react'
import { Config } from 'lib/types'
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
import { ArtifactRepository, GitArtifactRepository } from 'lib/artifact.port'

interface ConfigContextProps {
  artifactRepo: ArtifactRepository
  config: Config
  loading: boolean
  reloadConfig: () => void
}

const artifactRepo = new GitArtifactRepository({
  owner: 'fuji-money',
  repo: 'tapscripts',
  branch: 'main',
})

const emptyConfig = {
  assets: [],
  offers: [],
  oracles: [],
  xOnlyTreasuryPublicKey: '',
}

export const ConfigContext = createContext<ConfigContextProps>({
  artifactRepo,
  config: emptyConfig,
  loading: true,
  reloadConfig: () => {},
})

export const ConfigProvider = ({ children }: { children: ReactNode }) => {
  const { network } = useContext(WalletContext)
  const [config, setConfig] = useState<Config>(emptyConfig)
  const [loading, setLoading] = useState(true)

  const reloadConfig = async () => {
    // return if network not defined
    if (!network) {
      setLoading(false)
      return
    }

    // fetch config from factory
    const config = await fetchConfig(network)
    if (!config) return

    // populate oracles with name
    const oracles = config.oracles.map((oracle) => populateOracle(oracle))

    // populate assets with additional attributes
    const assets = config.assets
      .map((asset) => populateAsset(asset))
      .concat(getLBTC(network))

    // add value to lbtc and check if asset has reached circulation limit
    for (const asset of assets) {
      if (asset.ticker === TICKERS.lbtc)
        asset.value = await getBTCvalue(oracles[0])
      if (asset.maxCirculatingSupply) {
        asset.circulating = await getAssetCirculation(asset, network)
        if (asset.maxCirculatingSupply === asset.circulating)
          openModal(ModalIds.MintLimit)
      }
    }

    // populate offers with assets and oracles
    const offers = config.offers.map((offer) =>
      populateOffer(offer, assets, oracles),
    )

    setConfig({
      assets,
      offers,
      oracles,
      xOnlyTreasuryPublicKey: config.xOnlyIssuerPublicKey,
    })
    setLoading(false)
  }

  useEffect(() => {
    if (network) reloadConfig()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [network])

  return (
    <ConfigContext.Provider
      value={{ artifactRepo, config, loading, reloadConfig }}
    >
      {children}
    </ConfigContext.Provider>
  )
}
