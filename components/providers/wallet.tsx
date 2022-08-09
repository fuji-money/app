import { createContext, ReactNode, useEffect, useState } from 'react'
import { getBalances, getMarinaProvider, getNetwork } from 'lib/marina'
import { Balance, MarinaProvider, NetworkString } from 'marina-provider'
import { defaultNetwork } from 'lib/constants'

interface WalletContextProps {
  balances: Balance[]
  connected: boolean
  marina: MarinaProvider | undefined
  network: NetworkString
}

export const WalletContext = createContext<WalletContextProps>({
  balances: [],
  connected: false,
  marina: undefined,
  network: defaultNetwork,
})

interface WalletProviderProps {
  children: ReactNode
}
export const WalletProvider = ({ children }: WalletProviderProps) => {
  const [balances, setBalances] = useState<Balance[]>([])
  const [connected, setConnected] = useState(false)
  const [marina, setMarina] = useState<MarinaProvider>()
  const [network, setNetwork] = useState<NetworkString>(defaultNetwork)

  const updateBalances = async () => setBalances(await getBalances())

  // update marina
  useEffect(() => {
    getMarinaProvider().then((payload) => setMarina(payload))
  })

  // update connected
  useEffect(() => {
    if (marina) {
      marina.isEnabled().then((payload) => setConnected(payload))
    } else {
      setConnected(false)
    }
  }, [marina])

  // add event listeners for enable and disable (aka connected)
  useEffect(() => {
    if (marina) {
      if (connected) {
        const id = marina.on('DISABLED', () => setConnected(false))
        return () => marina.off(id)
      } else {
        const id = marina.on('ENABLED', () => setConnected(true))
        return () => marina.off(id)
      }
    }
  }, [connected, marina])

  // update network and add event listener
  useEffect(() => {
    if (connected && marina) {
      getNetwork().then((payload) => setNetwork(payload))
      // add event listener
      const id = marina.on('NETWORK', (payload) => setNetwork(payload))
      return () => marina.off(id)
    }
  }, [connected, marina])

  // update balances and add event listener
  useEffect(() => {
    if (connected && marina) {
      updateBalances()
      // add event listener
      const id = marina.on('NEW_TX', (_) => updateBalances())
      return () => marina.off(id)
    }
  }, [connected, marina, network])

  return (
    <WalletContext.Provider value={{ balances, connected, marina, network }}>
      {children}
    </WalletContext.Provider>
  )
}
