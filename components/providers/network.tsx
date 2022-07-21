import { createContext, ReactNode, useEffect, useState } from 'react'
import { getMarina } from 'lib/marina'

export const NetworkContext = createContext({
  network: 'testnet',
})

interface NetworkProviderProps {
  children: ReactNode
}
export const NetworkProvider = ({ children }: NetworkProviderProps) => {
  const [network, setNetwork] = useState('testnet')

  useEffect(() => {
    async function getMarinaNetwork() {
      const marina = await getMarina()
      if (marina) {
        setNetwork(await marina.getNetwork())
        marina.on('NETWORK', (payload: string) => setNetwork(payload))
      }
    }
    getMarinaNetwork()
  })

  return (
    <NetworkContext.Provider value={{ network }}>
      {children}
    </NetworkContext.Provider>
  )
}