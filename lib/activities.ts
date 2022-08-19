import { getNetwork } from './marina'
import { prettyAsset } from './pretty'
import { addActivityToStorage, getActivitiesFromStorage, saveActivitiesToStorage } from './storage'
import { Activity, ActivityType, Contract } from './types'

export function addActivity(contract: Contract, type: ActivityType): void {
  if (typeof window === 'undefined') return
  if (!contract.txid) throw new Error('Contract with no txid')
  const txid = contract.txid
  const prefix = `Contract ${type.toLowerCase()} with success`
  const suffix = prettyAsset(contract.synthetic)
  const message = `${prefix} - ${suffix}`
  const network = contract.network || 'testnet' // TODO
  const activity: Activity = {
    contract,
    createdAt: Date.now(),
    message,
    network,
    txid,
    type,
  }
  addActivityToStorage(activity)
}

export async function getActivities(): Promise<Activity[]> {
  const network = await getNetwork()
  return getActivitiesFromStorage().filter(
    (activity: Activity) => activity.network === network,
  )
}

export function removeActivity(
  contract: Contract,
  type: ActivityType,
): void {
  const activities = getActivitiesFromStorage()
  const index = activities.findIndex(
    (activity: Activity) =>
      activity.contract.txid === contract.txid && activity.type === type,
  )
  if (index !== -1) {
    const newActivities = [
      ...activities.slice(0, index),
      ...activities.slice(index + 1),
    ]
    saveActivitiesToStorage(newActivities)
  }
}
