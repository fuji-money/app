import { NetworkString } from 'marina-provider'
import { Activity, Contract, SwapInfo } from './types'

// contracts

export const localStorageContractsKey = 'fujiContracts'

export function getContractsFromStorage(): Contract[] {
  if (typeof window === 'undefined') return []
  const storedContracts = localStorage.getItem(localStorageContractsKey)
  if (!storedContracts) return []
  return JSON.parse(storedContracts)
}

export function getMyContractsFromStorage(
  network: NetworkString,
  xPubKey: string,
): Contract[] {
  return getContractsFromStorage()
    .filter((contract) => contract.network === network)
    .filter((contract) => contract.xPubKey === xPubKey)
}

export function saveContractsToStorage(contracts: Contract[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(localStorageContractsKey, JSON.stringify(contracts))
}

export function addContractToStorage(contract: Contract): void {
  if (typeof window === 'undefined') return
  const contracts = getContractsFromStorage()
  contracts.push(contract)
  saveContractsToStorage(contracts)
}

export function updateContractOnStorage(contract: Contract): void {
  if (typeof window === 'undefined') return
  saveContractsToStorage(
    getContractsFromStorage().map((c) =>
      c.txid === contract.txid ? contract : c,
    ),
  )
}

// activities

const localStorageActivitiesKey = 'fujiActivities'

export function saveActivitiesToStorage(activities: Activity[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(localStorageActivitiesKey, JSON.stringify(activities))
}

export function getActivitiesFromStorage(): Activity[] {
  if (typeof window === 'undefined') return []
  const storedActivities = localStorage.getItem(localStorageActivitiesKey)
  if (!storedActivities) return []
  return JSON.parse(storedActivities)
}

export function addActivityToStorage(activity: Activity): void {
  if (typeof window === 'undefined') return
  const activities = getActivitiesFromStorage()
  activities.push(activity)
  saveActivitiesToStorage(activities)
}

// swaps

export const localStorageSwapsKey = 'fujiSwaps'

function saveSwapsToStorage(swaps: SwapInfo[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(localStorageSwapsKey, JSON.stringify(swaps))
}

function getSwapsFromStorage(): SwapInfo[] {
  if (typeof window === 'undefined') return []
  const storedSwaps = localStorage.getItem(localStorageSwapsKey)
  return storedSwaps ? JSON.parse(storedSwaps) : []
}

export function addSwapToStorage(swap: SwapInfo): void {
  if (typeof window === 'undefined') return
  const now = new Date()
  swap.boltzRefund.currency = 'L-BTC'
  swap.timestamp = now.getTime()
  swap.when = now
  const swaps = getSwapsFromStorage()
  swaps.push(swap)
  saveSwapsToStorage(swaps)
}
