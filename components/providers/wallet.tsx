import { createContext, ReactNode, useEffect, useState } from 'react'
import {
  getBalances,
  getMarinaProvider,
  getNetwork,
  getXPubKey,
} from 'lib/marina'
import { Balance, MarinaProvider, NetworkString } from 'marina-provider'
import { defaultNetwork } from 'lib/constants'

interface WalletContextProps {
  balances: Balance[]
  connected: boolean
  marina: MarinaProvider | undefined
  network: NetworkString
  xPubKey: string
}

export const WalletContext = createContext<WalletContextProps>({
  balances: [],
  connected: false,
  marina: undefined,
  network: defaultNetwork,
  xPubKey: '',
})

interface WalletProviderProps {
  children: ReactNode
}
export const WalletProvider = ({ children }: WalletProviderProps) => {
  const [balances, setBalances] = useState<Balance[]>([])
  const [connected, setConnected] = useState(false)
  const [marina, setMarina] = useState<MarinaProvider>()
  const [network, setNetwork] = useState<NetworkString>(defaultNetwork)
  const [xPubKey, setXPubKey] = useState('')

  const updateBalances = async () => setBalances(await getBalances())
  const updateNetwork = async () => setNetwork(await getNetwork())
  const updateXPubKey = async () => setXPubKey(await getXPubKey())

  // get marina provider
  useEffect(() => {
    getMarinaProvider().then((payload) => setMarina(payload))
  })

  // update connected state
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
      updateNetwork()
      const id = marina.on('NETWORK', () => updateNetwork())
      return () => marina.off(id)
    }
  }, [connected, marina])

  // update balances and add event listener
  useEffect(() => {
    if (connected && marina) {
      updateBalances()
      updateXPubKey()
      const id = marina.on('SPENT_UTXO', () => updateBalances())
      return () => marina.off(id)
    }
  }, [connected, marina, network])

  return (
    <WalletContext.Provider
      value={{ balances, connected, marina, network, xPubKey }}
    >
      {children}
    </WalletContext.Provider>
  )
}
