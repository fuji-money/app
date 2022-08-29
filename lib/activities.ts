import { getNetwork } from './marina'
import { prettyAsset } from './pretty'
import {
  addActivityToStorage,
  getActivitiesFromStorage,
  saveActivitiesToStorage,
} from './storage'
import { Activity, ActivityType, Contract, ContractState } from './types'

// add activity type for given contract to storage
// removes all previous activities with this type to garantee uniqueness
export function addActivity(
  contract: Contract,
  type: ActivityType,
  createdAt: number,
): void {
  if (typeof window === 'undefined') return
  if (!contract.txid) throw new Error('Contract with no txid')
  if (!contract.network) throw new Error('Contract with no network')
  // remove all previous activities with this type
  removeActivities(contract, type)
  // add new activity
  const txid = contract.txid
  const prefix = `Contract ${type.toLowerCase()} with success`
  const suffix = prettyAsset(contract.synthetic)
  const message = `${prefix} - ${suffix}`
  const network = contract.network
  const activity: Activity = {
    contract,
    createdAt,
    message,
    network,
    txid,
    type,
  }
  addActivityToStorage(activity)
}

// get all activities on storage for this network
export async function getActivities(): Promise<Activity[]> {
  const network = await getNetwork()
  return getActivitiesFromStorage().filter(
    (activity: Activity) => activity.network === network,
  )
}

// removes all activities for this contract with this activity type
// and updates storage
export function removeActivities(contract: Contract, type: ActivityType): void {
  if (!type) return
  const { txid } = contract
  const activities = getActivitiesFromStorage().filter(
    (a: Activity) => !(a.contract.txid === txid && a.type === type),
  )
  saveActivitiesToStorage(activities)
}
