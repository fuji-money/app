import { createContext, ReactNode, useEffect, useState } from 'react'
import {
  getBalances,
  getMarinaProvider,
  getNetwork,
  getMainAccountXPubKey,
} from 'lib/marina'
import { Balance, MarinaProvider, NetworkString } from 'marina-provider'
import { defaultNetwork } from 'lib/constants'
import { ChainSource, WsElectrumChainSource } from 'lib/chainsource.port'

interface WalletContextProps {
  balances: Balance[]
  connected: boolean
  marina: MarinaProvider | undefined
  network: NetworkString
  setConnected: (arg0: boolean) => void
  xPubKey: string
  chainSource: ChainSource
}

export const WalletContext = createContext<WalletContextProps>({
  balances: [],
  connected: false,
  marina: undefined,
  network: defaultNetwork,
  setConnected: () => {},
  xPubKey: '',
  chainSource: new WsElectrumChainSource(defaultNetwork),
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
  const [chainSource, setChainSource] = useState<ChainSource>(
    new WsElectrumChainSource(defaultNetwork),
  )

  const updateBalances = async () => setBalances(await getBalances())
  const updateNetwork = async () => setNetwork(await getNetwork())
  const updateXPubKey = async () => setXPubKey(await getMainAccountXPubKey())

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
      const onDisabledId = marina.on('DISABLED', ({ data }) => {
        if (data.network === network) setConnected(false)
      })
      const onEnabledId = marina.on('ENABLED', ({ data }) => {
        if (data.network === network) setConnected(true)
      })
      return () => {
        marina.off(onDisabledId)
        marina.off(onEnabledId)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [marina])

  // update network and add event listener
  useEffect(() => {
    if (connected && marina) {
      updateNetwork()
      const id = marina.on('NETWORK', () => updateNetwork())
      return () => marina.off(id)
    }
  }, [connected, marina])

  useEffect(() => {
    if (chainSource.network !== network) {
      chainSource
        .close()
        .then(() => {
          setChainSource(new WsElectrumChainSource(network))
        })
        .catch(console.error)
    }
  }, [network, chainSource])

  // update balances and add event listener
  useEffect(() => {
    const updateBalancesAddEventListener = async () => {
      if (connected && marina) {
        if (await marina.isEnabled()) {
          await updateBalances()
          await updateXPubKey()
          const id = marina.on('SPENT_UTXO', () => updateBalances())
          return () => marina.off(id)
        }
      }
    }
    updateBalancesAddEventListener()
  }, [connected, marina, network])

  return (
    <WalletContext.Provider
      value={{
        balances,
        connected,
        marina,
        network,
        setConnected,
        xPubKey,
        chainSource,
      }}
    >
      {children}
    </WalletContext.Provider>
  )
}
