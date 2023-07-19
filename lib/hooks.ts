import { useEffect, useState } from 'react'
import { Coin, Wallet } from './wallet'

type BalanceMap = Record<string, Record<string, number>>

async function safeGetBalances(
  wallet: Wallet,
): Promise<Record<string, number>> {
  try {
    return wallet.getBalances()
  } catch (e) {
    console.warn('error getting balances', e)
    return {}
  }
}

export const useSelectBalances = (wallets: Wallet[]) => {
  const [balances, setBalances] = useState<BalanceMap>()

  useEffect(() => {
    if (wallets.length === 0) return

    const closeFns: (() => void)[] = []

    for (const wallet of wallets) {
      safeGetBalances(wallet)
        .then((initialBalances) => {
          setBalances((current) => {
            const newBalances = current ? { ...current } : {}
            newBalances[wallet.type] = initialBalances
            return newBalances
          })

          const closeOnNewUtxo = wallet.onNewUtxo((utxo: Coin) => {
            if (!utxo.blindingData) return
            const { asset, value } = utxo.blindingData

            setBalances((current) => {
              const newBalances = { ...current }
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
        })
        .catch(console.error)
    }

    return () => {
      for (const closeFn of closeFns) closeFn()
    }
  }, [wallets])

  return balances ?? {}
}
