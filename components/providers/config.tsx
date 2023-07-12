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
import { Artifact } from '@ionio-lang/ionio'
import { getArtifact } from 'lib/artifact'

interface ConfigContextProps {
  artifact: Artifact
  config: Config
  loading: boolean
  reloadConfig: () => void
}

const emptyArtifact = { contractName: '', constructorInputs: [], functions: [] }
const emptyConfig = { assets: [], offers: [], oracles: [] }

export const ConfigContext = createContext<ConfigContextProps>({
  artifact: emptyArtifact,
  config: emptyConfig,
  loading: true,
  reloadConfig: () => {},
})

export const ConfigProvider = ({ children }: { children: ReactNode }) => {
  const { wallet } = useContext(WalletContext)

  const [artifact, setArtifact] = useState<Artifact>(emptyArtifact)
  const [config, setConfig] = useState<Config>(emptyConfig)
  const [loading, setLoading] = useState(true)

  const reloadConfig = async () => {
    // return if network not defined
    if (!wallet) {
      setLoading(false)
      return
    }

    const network = await wallet.getNetwork()

    // fetch config from factory
    const config: ConfigResponse = await fetchConfig(network)
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

    setConfig({ assets, offers, oracles })
    setLoading(false)
  }

  useEffect(() => {
    getArtifact().then(setArtifact)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (wallet) reloadConfig()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wallet])

  return (
    <ConfigContext.Provider value={{ artifact, config, loading, reloadConfig }}>
      {children}
    </ConfigContext.Provider>
  )
}
