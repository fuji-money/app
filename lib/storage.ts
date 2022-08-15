import { Activity, Contract } from './types'

// contracts

const localStorageContractsKey = 'fujiContracts'

export function getContractsFromStorage(): Contract[] {
  if (typeof window === 'undefined') return []
  const storedContracts = localStorage.getItem(localStorageContractsKey)
  if (!storedContracts) return []
  return JSON.parse(storedContracts)
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
