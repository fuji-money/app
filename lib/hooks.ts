import { useEffect, useState } from 'react'
import { Wallet } from './wallet'
import { Balance } from 'marina-provider'

export const useSelectBalances = (wallet?: Wallet) => {
  const [balances, setBalances] = useState<Balance[]>([])

  useEffect(() => {
    if (!wallet) {
      setBalances([])
      return
    }

    const getBalances = async () => {
      const balances = await wallet.getBalances()
      console.log('balances', balances)
      setBalances(balances)
    }

    getBalances().catch(console.error)

    const closeOnNewUtxo = wallet.onNewUtxo(() => {
      getBalances().catch(console.error)
    })

    const closeOnSpentUtxo = wallet.onSpentUtxo(() => {
      getBalances().catch(console.error)
    })

    return () => {
      closeOnNewUtxo()
      closeOnSpentUtxo()
    }
  }, [wallet])

  return balances
}
