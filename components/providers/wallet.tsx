import { createContext, ReactNode, useEffect, useState } from 'react'
import {
  getBalances,
  getFujiCoins,
  getMarinaProvider,
  getNetwork,
} from 'lib/marina'
import { Balance, MarinaProvider, NetworkString, Utxo } from 'marina-provider'
import { defaultNetwork } from 'lib/constants'
import {
  confirmContract,
  getContract,
  getUnconfirmedContracts,
} from 'lib/contracts'
import { getContractsFromStorage } from 'lib/storage'

interface WalletContextProps {
  balances: Balance[]
  connected: boolean
  fujiCoins: Utxo[]
  marina: MarinaProvider | undefined
  network: NetworkString
}

export const WalletContext = createContext<WalletContextProps>({
  balances: [],
  connected: false,
  fujiCoins: [],
  marina: undefined,
  network: defaultNetwork,
})

interface WalletProviderProps {
  children: ReactNode
}
export const WalletProvider = ({ children }: WalletProviderProps) => {
  const [balances, setBalances] = useState<Balance[]>([])
  const [connected, setConnected] = useState(false)
  const [fujiCoins, setFujiCoins] = useState<Utxo[]>([])
  const [marina, setMarina] = useState<MarinaProvider>()
  const [network, setNetwork] = useState<NetworkString>(defaultNetwork)

  const updateBalances = async () => setBalances(await getBalances())
  const updateFujiCoins = async () => setFujiCoins(await getFujiCoins())
  const updateNetwork = async () => setNetwork(await getNetwork())

  // update marina
  getMarinaProvider().then((payload) => setMarina(payload))

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
      updateNetwork()
      const id = marina.on('NETWORK', (_) => updateNetwork())
      return () => marina.off(id)
    }
  }, [connected, marina])

  // on NEW_TX, check if it's a contract confirmation
  useEffect(() => {
    if (connected && marina) {
      const unconfirmedTxIds = getUnconfirmedContracts().map((c) => c.txid)
      const id = marina.on('NEW_TX', (tx) => {
        console.log('NEW_TX', tx)
        if (unconfirmedTxIds.includes(tx.txid)) {
          getContract(tx.txid).then((contract) => {
            if (contract) confirmContract(contract)
          })
        }
      })
      return () => marina.off(id)
    }
  }, [connected, marina, network])

  // update fuji coins and add event listener
  useEffect(() => {
    if (connected && marina) {
      updateBalances()
      updateFujiCoins()
      const id = marina.on('SPENT_UTXO', (utxo) => {
        console.log('SPENT_UTXO', utxo)
        updateBalances()
        updateFujiCoins()
      })
      return () => marina.off(id)
    }
  }, [connected, marina, network])

  return (
    <WalletContext.Provider
      value={{ balances, connected, fujiCoins, marina, network }}
    >
      {children}
    </WalletContext.Provider>
  )
}
