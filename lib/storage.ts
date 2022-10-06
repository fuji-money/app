import { NetworkString } from 'marina-provider'
import { Activity, BoltzKey, Contract } from './types'

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

// keys

const localStorageBoltzKeysKey = 'fujiBoltzKeys'

function saveBoltzKeysToStorage(boltzKeys: BoltzKey[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(localStorageBoltzKeysKey, JSON.stringify(boltzKeys))
}

function getBoltzKeysFromStorage(): BoltzKey[] {
  if (typeof window === 'undefined') return []
  const storedBoltzKeys = localStorage.getItem(localStorageBoltzKeysKey)
  if (!storedBoltzKeys) return []
  return JSON.parse(storedBoltzKeys)
}

export function addBoltzKeyToStorage(boltzKey: BoltzKey): void {
  if (typeof window === 'undefined') return
  const now = new Date()
  boltzKey.currency = 'L-BTC'
  boltzKey.timestamp = now.getTime()
  boltzKey.when = now
  const boltzKeys = getBoltzKeysFromStorage()
  boltzKeys.push(boltzKey)
  saveBoltzKeysToStorage(boltzKeys)
}
