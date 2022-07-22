import {
  createContext,
  ReactNode,
  useEffect,
  useState,
} from 'react'
import { getMarina, getNetwork } from 'lib/marina'
import { MarinaProvider } from 'marina-provider'

export const NetworkContext = createContext({
  network: 'testnet',
})

interface NetworkProviderProps {
  children: ReactNode
}
export const NetworkProvider = ({ children }: NetworkProviderProps) => {
  const [network, setNetwork] = useState('testnet')
  const [marina, setMarina] = useState<MarinaProvider>()

  // push marina to state
  useEffect(() => {
    ;(async () => {
      const marina = await getMarina()
      if (marina) setMarina(marina)
    })()
  })

  // push network to state
  useEffect(() => {
    ;(async () => {
      if (marina) {
        const network = await getNetwork()
        if (network) setNetwork(network)
      }
    })()
  })

  useEffect(() => {
    if (marina) {
      const id = marina.on('NETWORK', (payload: string) => setNetwork(payload))
      return () => marina.off(id)
    }
  })

  return (
    <NetworkContext.Provider value={{ network }}>
      {children}
    </NetworkContext.Provider>
  )
}
