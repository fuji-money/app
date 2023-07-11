import {
  createContext,
  ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'
import { defaultNetwork } from 'lib/constants'
import { ChainSource, WsElectrumChainSource } from 'lib/chainsource.port'
import { Wallet, WalletType } from 'lib/wallet'
import { MarinaWallet } from 'lib/marina'
import { NetworkString } from 'marina-provider'

interface WalletContextProps {
  wallets: Wallet[]
  chainSource?: ChainSource
  network: NetworkString

  wallet?: Wallet;
  selectWallet(type: WalletType): Promise<void>
}

function walletFactory(type: WalletType): Promise<Wallet | undefined> {
  switch (type) {
    case WalletType.Marina:
      return MarinaWallet.detect()
    case WalletType.Alby:
      throw new Error('Alby wallet not implemented')
    default:
      throw new Error('Unknown wallet type')
  }
}

async function detectWallets(): Promise<Wallet[]> {
  const supportedWallets = [WalletType.Marina]
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
  wallets: [],
  wallet: undefined,
  selectWallet: () => Promise.resolve(),
  network: defaultNetwork,
})

interface WalletProviderProps {
  children: ReactNode
}

export const WalletProvider = ({ children }: WalletProviderProps) => {
  const [wallets, setWallets] = useState<Wallet[]>([])
  const [wallet, setWallet] = useState<Wallet | undefined>(undefined)
  const [closeNetworkListener, setCloseNetworkLst] = useState<() => void>()
  const [chainSource, setChainSource] = useState<{
    network: string
    src: ChainSource
  }>()

  const selectWallet = useCallback(
    async (type: WalletType) => {
      const wallet = wallets.find((wallet) => wallet.type === type)
      if (!wallet) throw new Error(`Wallet ${type} not found`)
      setWallet(wallet)
      // close previous listeners
      closeNetworkListener?.() 
      chainSource?.src.close() // close chain source

      const closeOnNetworkChange = wallet.onNetworkChange((network) => {
        if (network !== chainSource?.network) {
          closeNetworkListener?.()
          chainSource?.src.close().catch(console.error)
          const src = new WsElectrumChainSource(network)
          setChainSource({
            network,
            src,
          })
        }
      })
      setCloseNetworkLst(() => closeOnNetworkChange)
    },
    [wallets, chainSource, closeNetworkListener],
  )

  useEffect(() => {
    detectWallets()
      .then(setWallets)
      .then(() => selectWallet(WalletType.Marina)) // select marina by default
      .catch(console.error)
  }, [selectWallet])

  return (
    <WalletContext.Provider
      value={{
        wallets,
        chainSource: chainSource?.src,
        network: chainSource?.network as NetworkString ?? defaultNetwork,
        wallet,
        selectWallet,
      }}
    >
      {children}
    </WalletContext.Provider>
  )
}
