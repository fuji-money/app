import { createContext, ReactNode, useEffect, useState } from 'react'
import {
  getBalances,
  getMarinaProvider,
  getNetwork,
  getXPubKey,
} from 'lib/marina'
import {
  AddressInterface,
  Balance,
  MarinaProvider,
  NetworkString,
} from 'marina-provider'
import { defaultNetwork, marinaMainAccountID } from 'lib/constants'
import { address } from 'liquidjs-lib'
import { BlindPrivKeysMap } from 'lib/types'
import { requestProvider, WebLNProvider } from 'webln'

interface WalletContextProps {
  balances: Balance[]
  blindPrivKeysMap: BlindPrivKeysMap
  connected: boolean
  marina: MarinaProvider | undefined
  network: NetworkString
  setConnected: (arg0: boolean) => void
  xPubKey: string
  weblnProvider: WebLNProvider | undefined
  weblnProviderName: string
}

export const WalletContext = createContext<WalletContextProps>({
  balances: [],
  blindPrivKeysMap: {},
  connected: false,
  marina: undefined,
  network: defaultNetwork,
  setConnected: () => {},
  xPubKey: '',
  weblnProvider: undefined,
  weblnProviderName: '',
})

interface WalletProviderProps {
  children: ReactNode
}
export const WalletProvider = ({ children }: WalletProviderProps) => {
  const [balances, setBalances] = useState<Balance[]>([])
  const [blindPrivKeysMap, setBlindPrivKeysMap] = useState({})
  const [connected, setConnected] = useState(false)
  const [marina, setMarina] = useState<MarinaProvider>()
  const [network, setNetwork] = useState<NetworkString>(defaultNetwork)
  const [xPubKey, setXPubKey] = useState('')
  const [weblnProvider, setWeblnProvider] = useState<WebLNProvider>()
  const [weblnProviderName, setWeblnProviderName] = useState('')

  const updateBalances = async () => setBalances(await getBalances())
  const updateNetwork = async () => setNetwork(await getNetwork())
  const updateXPubKey = async () => setXPubKey(await getXPubKey())

  // get marina provider
  useEffect(() => {
    getMarinaProvider().then((payload) => setMarina(payload))
  })

  // get webln provider
  useEffect(() => {
    try {
      if (!weblnProvider)
        requestProvider().then((provider) => {
          setWeblnProvider(provider)
          provider.getInfo().then((info) => {
            if (info.node.alias.includes('getalby.com'))
              setWeblnProviderName('Alby')
          })
        })
    } catch (ignore) {}
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

  // update balances and add event listener
  useEffect(() => {
    updateBalances()
    if (connected && marina) {
      updateXPubKey()
      const id = marina.on('SPENT_UTXO', () => updateBalances())
      return () => marina.off(id)
    }
  }, [connected, marina, network])

  useEffect(() => {
    if (connected && marina) {
      const map: BlindPrivKeysMap = {}
      const addressScriptHex = (a: AddressInterface) =>
        address.toOutputScript(a.confidentialAddress).toString('hex')
      marina.getAddresses([marinaMainAccountID]).then((addresses) => {
        for (const addr of addresses) {
          map[addressScriptHex(addr)] = addr.blindingPrivateKey
        }
        setBlindPrivKeysMap(map)
      })
    }
  }, [connected, marina, network])

  return (
    <WalletContext.Provider
      value={{
        balances,
        blindPrivKeysMap,
        connected,
        marina,
        network,
        setConnected,
        xPubKey,
        weblnProvider,
        weblnProviderName,
      }}
    >
      {children}
    </WalletContext.Provider>
  )
}
