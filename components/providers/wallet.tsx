import {
  createContext,
  ReactNode,
  useCallback,
  useEffect,
  useState,
} from 'react'
import { Wallet, WalletType } from 'lib/wallet'
import { MarinaWallet } from 'lib/marina'
import { AlbyWallet } from 'lib/alby'
import { NetworkString } from 'marina-provider'
import { defaultNetwork } from 'lib/constants'
import {
  getGlobalsFromStorage,
  LocalStorageBlindersRepository,
  LocalStorageConfigRepository,
  LocalStorageTransactionsRepository,
  saveNetworkGlobal,
} from 'lib/storage'
import { useSelectBalances } from 'lib/hooks'
import { GitArtifactRepository } from 'lib/artifact.port'

export const artifactRepo = new GitArtifactRepository({
  owner: 'fuji-money',
  repo: 'tapscripts',
  branch: 'main',
})

interface WalletContextProps {
  initializing: boolean
  installedWallets: Wallet[]
  wallets: Wallet[] // wallets connected & belonging to the selected network
  network: NetworkString
  setNetwork: (network: NetworkString) => Promise<void>
  connect: (type: WalletType) => Promise<void>
  balances: Record<string, Record<string, number>>
}

const txRepo = new LocalStorageTransactionsRepository()
const blindersRepo = new LocalStorageBlindersRepository()

function walletFactory(type: WalletType): Promise<Wallet | undefined> {
  switch (type) {
    case WalletType.Marina:
      return MarinaWallet.detect()
    case WalletType.Alby:
      // alby needs some repos to cache the chain data
      return AlbyWallet.detect(txRepo, blindersRepo, artifactRepo)
    default:
      throw new Error('Unknown wallet type')
  }
}

// which wallets will be detected at startup
const SUPPORTED_WALLETS = [WalletType.Marina, WalletType.Alby]

function isFullfilled(
  p: PromiseSettledResult<Wallet | undefined>,
): p is PromiseFulfilledResult<Wallet> {
  return p.status === 'fulfilled' && p.value !== undefined
}

export const WalletContext = createContext<WalletContextProps>({
  installedWallets: [],
  wallets: [],
  network: defaultNetwork,
  setNetwork: async () => {},
  connect: async () => {},
  balances: {},
  initializing: true,
})

interface WalletProviderProps {
  children: ReactNode
}

export const WalletProvider = ({ children }: WalletProviderProps) => {
  const [wallets, setWallets] = useState<Wallet[]>()
  const [installedWallets, setInstalledWallets] = useState<Wallet[]>()
  const [network, setNetworkInState] = useState<NetworkString>(defaultNetwork)
  const balances = useSelectBalances(wallets || [])

  useEffect(() => {
    const update = async () => {
      const walletsNetworks = await Promise.allSettled(
        (installedWallets || []).map((w) =>
          w.isConnected() ? w.getNetwork() : Promise.resolve(undefined),
        ),
      )

      const newWalletsState = (installedWallets || []).filter((_, index) => {
        const walletNetwork = walletsNetworks[index]
        return (
          walletNetwork.status === 'fulfilled' &&
          walletNetwork.value &&
          walletNetwork.value === network
        )
      })

      walletsNetworks.forEach((walletNetwork) => {
        if (walletNetwork.status === 'rejected') {
          console.error(walletNetwork.reason)
        }
      })

      return newWalletsState
    }

    if (!installedWallets) return
    update()
      .then(setWallets)
      .catch((e) => {
        console.error(e)
        setWallets([])
      })
  }, [installedWallets, network])

  const setNetwork = useCallback(
    async (newNetwork: NetworkString) => {
      if (newNetwork === 'regtest') throw new Error('regtest is not supported')
      if (network !== newNetwork) {
        setNetworkInState(newNetwork)
        saveNetworkGlobal(newNetwork)
      }
    },
    [network],
  )

  const connect = useCallback(
    async (type: WalletType) => {
      if (!installedWallets) throw new Error('Wallets not detected')
      if (!wallets) throw new Error('Wallets not detected')

      const fromInstalled = installedWallets.find((w) => w.type === type)
      if (!fromInstalled) throw new Error('Wallet not installed')
      await fromInstalled.connect()

      if (fromInstalled.isConnected()) {
        if (wallets.find((w) => w.type === type)) return
        const network = getGlobalsFromStorage().network
        const walletNetwork = await fromInstalled.getNetwork()
        if (walletNetwork !== network) return
        setWallets((prevWallets) =>
          prevWallets ? [...prevWallets, fromInstalled] : [fromInstalled],
        )
      }
    },
    [installedWallets, wallets],
  )

  useEffect(() => {
    const n = getGlobalsFromStorage().network
    if (n === network) return
    setNetwork(getGlobalsFromStorage().network).catch(console.error)
  }, [network, setNetwork])

  useEffect(() => {
    const walletFactoryPromises = SUPPORTED_WALLETS.map(walletFactory)
    Promise.allSettled(walletFactoryPromises).then((results) => {
      const newInstalledWallets = results
        .filter(isFullfilled)
        .map((r) => r.value)

      setInstalledWallets(newInstalledWallets)
    })
  }, [])

  return (
    <WalletContext.Provider
      value={{
        initializing: installedWallets === undefined || wallets === undefined,
        installedWallets: installedWallets || [],
        wallets: wallets || [],
        network,
        setNetwork,
        connect,
        balances,
      }}
    >
      {children}
    </WalletContext.Provider>
  )
}
