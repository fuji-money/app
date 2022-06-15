import { createContext, ReactNode, useEffect, useState } from 'react'
import { checkMarina } from 'lib/marina'

export const WalletContext = createContext({
  wallet: false,
  connect: () => {},
  disconnect: () => {},
})

interface WalletProviderProps {
  children: ReactNode
}
export const WalletProvider = ({ children }: WalletProviderProps) => {
  const [wallet, setWallet] = useState(false)
  const connect = () => setWallet(true)
  const disconnect = () => setWallet(false)

  useEffect(() => {
    checkMarina().then((bool: boolean) => setWallet(bool))
  })

  return (
    <WalletContext.Provider value={{ connect, disconnect, wallet }}>
      {children}
    </WalletContext.Provider>
  )
}
