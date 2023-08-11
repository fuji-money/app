import {
  createContext,
  ReactNode,
  useCallback,
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
import { Artifact } from '@ionio-lang/ionio'
import { getArtifact } from 'lib/artifact'

interface ConfigContextProps {
  artifact: Artifact
  config: Config
  loading: boolean
  reloadConfig: () => void
}

const emptyArtifact = { contractName: '', constructorInputs: [], functions: [] }
const emptyConfig = {
  assets: [],
  offers: [],
  oracles: [],
  xOnlyTreasuryPublicKey: '',
}

export const ConfigContext = createContext<ConfigContextProps>({
  artifact: emptyArtifact,
  config: emptyConfig,
  loading: true,
  reloadConfig: () => {},
})

export const ConfigProvider = ({ children }: { children: ReactNode }) => {
  const { network } = useContext(WalletContext)

  const [artifact, setArtifact] = useState<Artifact>(emptyArtifact)
  const [config, setConfig] = useState<Config>(emptyConfig)
  const [configs, setConfigs] = useState<
    Record<'liquid' | 'testnet', Config | undefined>
  >({
    liquid: undefined,
    testnet: undefined,
  })
  const [loading, setLoading] = useState(true)

  const reloadConfig = useCallback(
    async (net: 'liquid' | 'testnet', force = false) => {
      if (configs[net] && !force) return

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
    },
    [configs, network],
  )

  useEffect(() => {
    getArtifact().then(setArtifact)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (network === 'regtest') return
    reloadConfig(network)
  }, [network, reloadConfig])

  useEffect(() => {
    if (network === 'regtest') return
    const newConfig = configs[network]
    if (!newConfig) return
    setConfig(newConfig)
  }, [configs, network])

  return (
    <ConfigContext.Provider
      value={{
        artifact,
        config,
        loading,
        reloadConfig: () => reloadConfig(network as 'liquid' | 'testnet', true),
      }}
    >
      {children}
    </ConfigContext.Provider>
  )
}
