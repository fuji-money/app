import {
  createContext,
  ReactNode,
  useCallback,
  useEffect,
  useState,
} from 'react'
import { Wallet, WalletType } from 'lib/wallet'
import { MarinaWallet } from 'lib/marina'

interface WalletContextProps {
  wallets: Wallet[]
  wallet?: Wallet
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
})

interface WalletProviderProps {
  children: ReactNode
}

export const WalletProvider = ({ children }: WalletProviderProps) => {
  const [wallets, setWallets] = useState<Wallet[]>([])
  const [wallet, setWallet] = useState<Wallet | undefined>(undefined)

  const selectWallet = useCallback(
    async (type: WalletType) => {
      const wallet = wallets.find((wallet) => wallet.type === type)
      if (!wallet) throw new Error(`Wallet ${type} not found`)
      setWallet(wallet)
    },
    [wallets],
  )

  useEffect(() => {
    detectWallets().then(setWallets).catch(console.error)
  }, [selectWallet])

  return (
    <WalletContext.Provider
      value={{
        wallets,
        wallet,
        selectWallet,
      }}
    >
      {children}
    </WalletContext.Provider>
  )
}
