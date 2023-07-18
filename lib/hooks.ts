import { useEffect, useState } from 'react'
import { Coin, Wallet } from './wallet'

type BalanceMap = Record<string, Record<string, number>>

function safeGetBalances(wallet: Wallet): Promise<Record<string, number>> {
  try {
    if (!wallet.isConnected()) return Promise.resolve({})
    return wallet.getBalances()
  } catch (e) {
    return Promise.resolve({})
  }
}

export const useSelectBalances = (wallets: Wallet[]) => {
  const [balances, setBalances] = useState<BalanceMap>({})

  useEffect(() => {
    if (wallets.length === 0) {
      setBalances({})
      return
    }

    const closeFns: (() => void)[] = []

    for (const wallet of wallets) {
      safeGetBalances(wallet).then((balances) => {
        setBalances((current) => {
          const newBalances = { ...current }
          newBalances[wallet.type] = balances
          return newBalances
        })
      })

      const closeOnNewUtxo = wallet.onNewUtxo((utxo: Coin) => {
        if (!utxo.blindingData) return
        const { asset, value } = utxo.blindingData

        setBalances((balances) => {
          const newBalances = { ...balances }
          newBalances[wallet.type] = newBalances[wallet.type] ?? {}
          newBalances[wallet.type][asset] =
            (newBalances[wallet.type][asset] ?? 0) + value
          return newBalances
        })
      })

      closeFns.push(closeOnNewUtxo)

      const closeOnSpentUtxo = wallet.onSpentUtxo((utxo: Coin) => {
        if (!utxo.blindingData) return
        const { asset, value } = utxo.blindingData

        setBalances((balances) => {
          const newBalances = { ...balances }
          newBalances[wallet.type] = newBalances[wallet.type] ?? {}
          newBalances[wallet.type][asset] =
            (newBalances[wallet.type][asset] ?? 0) - value
          return newBalances
        })
      })

      closeFns.push(closeOnSpentUtxo)
    }

    return () => {
      for (const closeFn of closeFns) closeFn()
    }
  }, [wallets])

  return balances
}
