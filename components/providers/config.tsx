import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react'
import { Asset, ConfigResponse, Offer, Oracle } from 'lib/types'
import { WalletContext } from './wallet'
import { assetExplorerUrlMainnet, assetExplorerUrlTestnet } from 'lib/constants'
import { fetchConfig, getBTCvalue } from 'lib/api'
import { fromSatoshis, openModal } from 'lib/utils'
import { getLBTC, populateAsset, TICKERS } from 'lib/assets'
import { populateOffer } from 'lib/offers'
import { populateOracle } from 'lib/oracles'
import { fetchURL } from 'lib/fetch'
import { ModalIds } from 'components/modals/modal'

interface ConfigContextProps {
  assets: Asset[]
  offers: Offer[]
  oracles: Oracle[]
}

export const ConfigContext = createContext<ConfigContextProps>({
  assets: [],
  offers: [],
  oracles: [],
})

interface ConfigProviderProps {
  children: ReactNode
}

export const ConfigProvider = ({ children }: ConfigProviderProps) => {
  const { network } = useContext(WalletContext)

  const [assets, setAssets] = useState<Asset[]>([])
  const [offers, setOffers] = useState<Offer[]>([])
  const [oracles, setOracles] = useState<Oracle[]>([])

  const getAssetCirculation = async (asset: Asset): Promise<number> => {
    if (!asset.id) return 0
    const assetExplorerUrl =
      network === 'liquid' ? assetExplorerUrlMainnet : assetExplorerUrlTestnet
    const data = await fetchURL(`${assetExplorerUrl}${asset.id}`)
    if (!data) return 0
    const { chain_stats, mempool_stats } = data
    const issued = chain_stats.issued_amount + mempool_stats.issued_amount
    const burned = chain_stats.burned_amount + mempool_stats.burned_amount
    return fromSatoshis(issued - burned, asset.precision)
  }

  const reloadConfig = async () => {
    console.log('network', network)
    const config: ConfigResponse = await fetchConfig(network)
    if (!config) return

    const _assets = config.assets
      .map((asset) => populateAsset(asset))
      .concat(getLBTC(network))

    const _oracles = config.oracles.map((oracle) => populateOracle(oracle))

    for (const asset of _assets) {
      if (asset.ticker === TICKERS.lbtc)
        asset.value = await getBTCvalue(_oracles[0])
      if (asset.maxCirculatingSupply) {
        asset.circulating = await getAssetCirculation(asset)
        if (asset.maxCirculatingSupply === asset.circulating)
          openModal(ModalIds.MintLimit)
      }
    }

    const _offers = config.offers.map((offer) =>
      populateOffer(offer, _assets, _oracles),
    )

    setAssets(_assets)
    setOffers(_offers)
    setOracles(_oracles)

    console.log('end of network', network, _assets)
  }

  useEffect(() => {
    reloadConfig()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [network])

  return (
    <ConfigContext.Provider
      value={{
        assets,
        offers,
        oracles,
      }}
    >
      {children}
    </ConfigContext.Provider>
  )
}
