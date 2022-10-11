import { BlindPrivKeysMap, UtxoWithBlindPrivKey } from './types'
import { Utxo } from 'marina-provider'

const utxoScriptHex = (u: UtxoWithBlindPrivKey) =>
  u.prevout.script.toString('hex')

const utxoValue = (u: Utxo) => u.value || 0

// coin selection strategy: accumulate utxos until value is achieved
const accumulativeStrategy = (
  coins: UtxoWithBlindPrivKey[],
  target: number,
): UtxoWithBlindPrivKey[] => {
  let totalValue = 0
  const selectedCoins = []

  // push coins until target reached
  for (const coin of coins) {
    selectedCoins.push(coin)
    totalValue += utxoValue(coin)
    if (totalValue >= target) return selectedCoins
  }

  // not enough funds
  return []
}

// coin selection strategy: tries to get an exact value (no change)
const branchAndBoundStrategy = (
  coins: UtxoWithBlindPrivKey[],
  target: number,
): UtxoWithBlindPrivKey[] | undefined => {
  const MAX_TRIES = 1_000
  const selected: number[] = []

  let backtrack
  let currTry = 0
  let currValue = 0
  let utxo_pool_index = 0

  // calculate total available value
  let totalValue = coins.reduce(
    (acc: number, coin) => (acc += utxoValue(coin)),
    0,
  )

  // return undefined if we don't have enough funds
  if (totalValue < target) return

  // perform a depth-first search for choosing utxos
  while (currTry < MAX_TRIES) {
    // return if we found a working combination
    if (currValue == target) break

    // by default, don't backtrack
    backtrack = false

    // conditions for backtracking
    // 1. cannot reach target with remaining amount
    // 2. selected value is greater than upperbound
    if (currValue + totalValue < target || currValue > target) backtrack = true

    // backtrack if necessary
    if (backtrack) {
      // we walked back to first UTXO, all branches are traversed, we are done
      if (selected.length === 0) break

      // add omitted utxos back before traversing the omission branch of last included utxo
      utxo_pool_index -= 1
      while (utxo_pool_index > selected[selected.length - 1]) {
        totalValue += utxoValue(coins[utxo_pool_index])
        utxo_pool_index -= 1
      }

      // remove last included utxo from selected list
      currValue -= utxoValue(coins[utxo_pool_index])
      selected.pop()
    } else {
      // continue on this branch, add the next utxo to selected list
      let coin = coins[utxo_pool_index]

      // remove this utxo from total available amount
      totalValue -= utxoValue(coin)

      // if this utxo is the first one or
      // if the previous index is included and therefore not relevant for exclusion shortcut
      if (
        selected.length === 0 ||
        utxo_pool_index - 1 === selected[selected.length - 1]
      ) {
        selected.push(utxo_pool_index)
        currValue += utxoValue(coin)
      }
    }

    currTry += 1
    utxo_pool_index += 1
  }

  // if we exhausted all tries, return undefined
  if (currTry >= MAX_TRIES) return

  // if no coins found, return undefined
  if (selected.length === 0) return

  // return the selected utxos
  return selected.map((i) => coins[i])
}

// select coins for given amount, with respective blinding private key
export function selectCoinsWithBlindPrivKey(
  utxos: UtxoWithBlindPrivKey[],
  asset: string,
  minAmount: number,
  blindPrivKeysMap: BlindPrivKeysMap,
): UtxoWithBlindPrivKey[] {
  // return blinding private key for a given utxo
  const getUtxoBlindPrivKey = (u: Utxo): string | undefined =>
    blindPrivKeysMap[utxoScriptHex(u)]

  // sort utxos in descending order of value will decrease number of inputs
  // (and fees) but will increase utxo fragmentation
  utxos = utxos
    .filter((utxo) => utxo.asset === asset)
    .sort((a, b) => utxoValue(b) - utxoValue(a))
    .map((utxo) => ({ ...utxo, blindPrivKey: getUtxoBlindPrivKey(utxo) }))
    .filter((utxo) => utxo.blindPrivKey)

  // try to find a combination with exact value (aka no change) first
  return (
    branchAndBoundStrategy(utxos, minAmount) ??
    accumulativeStrategy(utxos, minAmount)
  )
}
