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
import { InMemoryTransactionRepository } from 'lib/transactions-repository'
import { InMemoryBlindersRepository } from 'lib/blinders-repository'
import { NetworkString } from 'marina-provider'
import { defaultNetwork } from 'lib/constants'
import { getGlobalsFromStorage, saveNetworkGlobal } from 'lib/storage'

interface WalletContextProps {
  installedWallets: Wallet[]
  wallets: Wallet[] // wallets connected & belonging to the selected network
  network: NetworkString
  setNetwork: (network: NetworkString) => Promise<void>
  connect: (type: WalletType) => Promise<void>
}

const txRepo = new InMemoryTransactionRepository()
const blindersRepo = new InMemoryBlindersRepository()

function walletFactory(type: WalletType): Promise<Wallet | undefined> {
  switch (type) {
    case WalletType.Marina:
      return MarinaWallet.detect()
    case WalletType.Alby:
      // alby needs some repos to cache the chain data
      return AlbyWallet.detect(txRepo, blindersRepo)
    default:
      throw new Error('Unknown wallet type')
  }
}

async function detectWallets(): Promise<Wallet[]> {
  const supportedWallets = [WalletType.Marina, WalletType.Alby]
  const walletsPromises = await Promise.allSettled(
    supportedWallets.map((type) => walletFactory(type)),
  )

  const wallets = []
  for (const walletPromise of walletsPromises) {
    if (walletPromise.status === 'fulfilled' && walletPromise.value) {
      wallets.push(walletPromise.value)
    }
  }
  return wallets
}

export const WalletContext = createContext<WalletContextProps>({
  installedWallets: [],
  wallets: [],
  network: defaultNetwork,
  setNetwork: async () => {},
  connect: async () => {},
})

interface WalletProviderProps {
  children: ReactNode
}

export const WalletProvider = ({ children }: WalletProviderProps) => {
  const [wallets, setWallets] = useState<Wallet[]>([])
  const [installedWallets, setInstalledWallets] = useState<Wallet[]>([])
  const [network, setNetworkInState] = useState<NetworkString>(defaultNetwork)

  const setNetwork = useCallback(
    async (newNetwork: NetworkString) => {
      if (newNetwork === 'regtest') throw new Error('regtest is not supported')
      if (network !== newNetwork) {
        setNetworkInState(newNetwork)
        saveNetworkGlobal(newNetwork)
      }
      const walletsNetworks = await Promise.allSettled(
        installedWallets.map((w) => w.getNetwork()),
      )

      const newWalletsState = installedWallets.filter((_, index) => {
        const walletNetwork = walletsNetworks[index]
        return (
          walletNetwork.status === 'fulfilled' &&
          walletNetwork.value === newNetwork
        )
      })

      walletsNetworks.forEach((walletNetwork) => {
        if (walletNetwork.status === 'rejected') {
          console.error(walletNetwork.reason)
        }
      })

      setWallets(newWalletsState)
    },
    [installedWallets, network],
  )

  const connect = useCallback(
    async (type: WalletType) => {
      const fromInstalled = installedWallets.find((w) => w.type === type)
      if (!fromInstalled) throw new Error('Wallet not installed')
      await fromInstalled.connect()

      if (fromInstalled.isConnected()) {
        if (wallets.find((w) => w.type === type)) return
        const network = getGlobalsFromStorage().network
        const walletNetwork = await fromInstalled.getNetwork()
        if (walletNetwork !== network) return
        setWallets((prevWallets) => [...prevWallets, fromInstalled])
      }
    },
    [installedWallets, wallets],
  )

  useEffect(() => {
    detectWallets()
      .then(setInstalledWallets)
      .then(() => setNetwork(getGlobalsFromStorage().network))
      .catch(console.error)
  }, [setNetwork])

  return (
    <WalletContext.Provider
      value={{
        installedWallets,
        wallets,
        network,
        setNetwork,
        connect,
      }}
    >
      {children}
    </WalletContext.Provider>
  )
}
