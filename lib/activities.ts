import { getNetwork } from './marina'
import { prettyAsset } from './pretty'
import { addActivityToStorage, getActivitiesFromStorage } from './storage'
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
    (activity: Activity) => activity.contract.network === network,
  )
}
