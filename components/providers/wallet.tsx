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

  const updateBalances = async () => setBalances(await getBalances())
  const updateNetwork = async () => setNetwork(await getNetwork())
  const updateXPubKey = async () => setXPubKey(await getMainAccountXPubKey())

  const firstRender = useRef(true)

  // get marina provider
  useEffect(() => {
    getMarinaProvider().then((payload) => setMarina(payload))
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
      // in the case user has marina on 'testnet' and defaultNetwork is 'liquid'
      // there's a race condition where the app starts by getting the config for
      // 'liquid' and then immediately for 'testnet', but with the risk of 'liquid'
      // beeing the last to end so the final state would be 'liquid' instead of 'testnet'
      marina.getNetwork().then((marinaNetwork) => {
        if (firstRender.current && marinaNetwork !== defaultNetwork) {
          sleep(2000).then(() => updateNetwork())
        } else {
          updateNetwork()
        }
      })
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
      }}
    >
      {children}
    </WalletContext.Provider>
  )
}
