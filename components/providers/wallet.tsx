import { createContext, ReactNode, useEffect, useRef, useState } from 'react'
import {
  getBalances,
  getMarinaProvider,
  getNetwork,
  getMainAccountXPubKey,
} from 'lib/marina'
import { Balance, MarinaProvider, NetworkString } from 'marina-provider'
import { defaultNetwork } from 'lib/constants'
import { ChainSource, WsElectrumChainSource } from 'lib/chainsource.port'
import { sleep } from 'lib/utils'

interface WalletContextProps {
  balances: Balance[]
  chainSource: ChainSource
  connected: boolean
  marina: MarinaProvider | undefined
  network: NetworkString
  setConnected: (arg0: boolean) => void
  updateBalances: () => void
  xPubKey: string
  warmingUp: boolean
}

export const WalletContext = createContext<WalletContextProps>({
  balances: [],
  chainSource: new WsElectrumChainSource(defaultNetwork),
  connected: false,
  marina: undefined,
  network: defaultNetwork,
  setConnected: () => {},
  updateBalances: () => {},
  xPubKey: '',
  warmingUp: true,
})

interface WalletProviderProps {
  children: ReactNode
}
export const WalletProvider = ({ children }: WalletProviderProps) => {
  const [balances, setBalances] = useState<Balance[]>([])
  const [chainSource, setChainSource] = useState<ChainSource>(
    new WsElectrumChainSource(defaultNetwork),
  )
  const [connected, setConnected] = useState(false)
  const [marina, setMarina] = useState<MarinaProvider>()
  const [network, setNetwork] = useState<NetworkString>(defaultNetwork)
  const [xPubKey, setXPubKey] = useState('')
  const [warmingUp, setWarmingUp] = useState(true)

  const updateBalances = async () => setBalances(await getBalances())
  const updateNetwork = async () => setNetwork(await getNetwork())
  const updateXPubKey = async () => setXPubKey(await getMainAccountXPubKey())

  // get marina provider
  useEffect(() => {
    getMarinaProvider().then((marinaProvider) => {
      if (!marinaProvider) setWarmingUp(false)
      else setMarina(marinaProvider)
    })
  }, [])

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
  }, [marina, network])

  // update network and add event listener
  useEffect(() => {
    if (connected && marina) {
      updateNetwork()
      // give time for network change to propagate across components
      // if user has marina on 'testnet' and app default is 'liquid'
      // a race condition could ocurr
      sleep(1000).then(() => setWarmingUp(false))
      const id = marina.on('NETWORK', updateNetwork)
      return () => marina.off(id)
    }
  }, [connected, marina])

  // when network changes, connect to respective electrum server
  useEffect(() => {
    if (network && chainSource.network !== network) {
      chainSource
        .close()
        .then(() => {
          setChainSource(new WsElectrumChainSource(network))
        })
        .catch(console.error)
    }
  }, [chainSource, network])

  // update balances and add event listener
  useEffect(() => {
    // marina can take up to 10 seconds to update balances
    // so web update balances now and on 10 seconds in the future
    const updateNowAndLater = () => {
      updateBalances()
      setTimeout(updateBalances, 10_000)
    }
    // add event listeners
    if (connected && marina) {
      marina.isEnabled().then((enabled) => {
        if (enabled) {
          updateBalances()
          updateXPubKey()
          const onSpentUtxoId = marina.on('SPENT_UTXO', updateNowAndLater)
          const onNewUtxoId = marina.on('NEW_UTXO', updateNowAndLater)
          return () => {
            marina.off(onSpentUtxoId)
            marina.off(onNewUtxoId)
          }
        }
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connected, network])

  return (
    <WalletContext.Provider
      value={{
        balances,
        chainSource,
        connected,
        marina,
        network,
        setConnected,
        updateBalances,
        xPubKey,
        warmingUp,
      }}
    >
      {children}
    </WalletContext.Provider>
  )
}
