import { NetworkString, UnblindingData } from 'marina-provider'
import { Activity, Contract, SwapInfo } from './types'
import { assetPair, expirationSeconds, expirationTimeout } from './constants'
import { BlindersRepository } from './blinders-repository'
import { TransactionRepository } from './transactions-repository'
import { ConfigRepository } from './config-repository'

// contracts

export const localStorageContractsKey = 'fujiContracts'

export function getContractsFromStorage(): Contract[] {
  if (typeof window === 'undefined') return []
  const storedContracts = localStorage.getItem(localStorageContractsKey)
  if (!storedContracts) return []
  const contracts = JSON.parse(storedContracts).map((c: Required<Contract>) => {
    c.contractParams.assetPair = assetPair
    c.contractParams.expirationTimeout = expirationTimeout
    return c
  })
  return contracts
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
  // store contracts without buffers for better reading by the user
  const contractsWithoutBuffers = structuredClone(contracts).map((c: any) => {
    const params = c.contractParams
    if (params?.assetPair) params.assetPair = assetPair.toString()
    if (params?.expirationTimeout) params.expirationTimeout = expirationSeconds
    return c
  })
  localStorage.setItem(
    localStorageContractsKey,
    JSON.stringify(contractsWithoutBuffers),
  )
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

// globals

export const localStorageGlobalsKey = 'fujiGlobals'

export type Globals = {
  network: 'liquid' | 'testnet'
}

export function getGlobalsFromStorage(): Globals {
  if (typeof window === 'undefined') return { network: 'liquid' }
  const storedGlobals = localStorage.getItem(localStorageGlobalsKey)
  if (!storedGlobals) return { network: 'liquid' }
  return JSON.parse(storedGlobals)
}

export function saveNetworkGlobal(network: 'liquid' | 'testnet'): void {
  if (typeof window === 'undefined') return
  const current = getGlobalsFromStorage()
  localStorage.setItem(
    localStorageGlobalsKey,
    JSON.stringify({ ...current, network }),
  )
}

// Alby repositories

const makeLocalStorageKey = (key: string) => 'fuji-' + key
const makeOutpointKey = (txID: string, vout: number) =>
  makeLocalStorageKey(`${txID}${vout}`)

export class LocalStorageBlindersRepository implements BlindersRepository {
  addBlindingData(
    txID: string,
    vout: number,
    blindingData: UnblindingData,
  ): Promise<void> {
    const key = makeOutpointKey(txID, vout)
    const data = JSON.stringify(blindingData)
    return Promise.resolve(localStorage.setItem(key, data))
  }

  getBlindingData(
    txID: string,
    vout: number,
  ): Promise<UnblindingData | undefined> {
    const key = makeOutpointKey(txID, vout)
    const data = localStorage.getItem(key)
    if (!data) return Promise.resolve(undefined)
    const blindingData = JSON.parse(data)
    return Promise.resolve(blindingData)
  }
}

export class LocalStorageTransactionsRepository
  implements TransactionRepository
{
  static txIDsListKey = makeLocalStorageKey('alby/txIDs')

  getAllTransactions(): Promise<string[]> {
    const txIDs = localStorage.getItem(
      LocalStorageTransactionsRepository.txIDsListKey,
    )
    if (!txIDs) return Promise.resolve([])

    // get all hexes
    const txs = JSON.parse(txIDs).map((txID: string) => {
      const key = makeLocalStorageKey(txID)
      const hex = localStorage.getItem(key)
      return hex
    })

    return Promise.resolve(txs)
  }

  addTransaction(txID: string, hex: string): Promise<void> {
    const txIDs = localStorage.getItem(
      LocalStorageTransactionsRepository.txIDsListKey,
    )
    const txIDsList = txIDs ? JSON.parse(txIDs) : []
    txIDsList.push(txID)
    localStorage.setItem(
      LocalStorageTransactionsRepository.txIDsListKey,
      JSON.stringify(txIDsList),
    )
    const key = makeLocalStorageKey(txID)
    return Promise.resolve(localStorage.setItem(key, hex))
  }

  getTransaction(txID: string): Promise<string | undefined> {
    const txIDs = localStorage.getItem(
      LocalStorageTransactionsRepository.txIDsListKey,
    )
    if (!txIDs) return Promise.resolve(undefined)
    const txIDsList = JSON.parse(txIDs)
    if (!txIDsList.includes(txID)) return Promise.resolve(undefined)

    const key = makeLocalStorageKey(txID)
    const hex = localStorage.getItem(key)
    if (!hex) return Promise.resolve(undefined)
    return Promise.resolve(hex)
  }
}

export class LocalStorageConfigRepository implements ConfigRepository {
  static ALBY_ENABLED_KEY = makeLocalStorageKey('alby-has-been-enabled')

  hasBeenEnabled(): Promise<boolean> {
    const enabled = localStorage.getItem(
      LocalStorageConfigRepository.ALBY_ENABLED_KEY,
    )

    return Promise.resolve(enabled === '1')
  }

  setEnabled(): Promise<void> {
    localStorage.setItem(LocalStorageConfigRepository.ALBY_ENABLED_KEY, '1')
    return Promise.resolve()
  }

  clear(): Promise<void> {
    localStorage.removeItem(LocalStorageConfigRepository.ALBY_ENABLED_KEY)
    return Promise.resolve()
  }
}
