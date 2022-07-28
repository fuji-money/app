import { getNetwork } from './marina'
import { prettyAsset } from './pretty'
import { Activity, ActivityType, Contract } from './types'

export function addActivity(contract: Contract, type: ActivityType): void {
  if (typeof window === 'undefined') return
  if (!contract.txid) throw new Error('Error: contract with no txid')
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
  const activities: Activity[] = JSON.parse(
    localStorage.getItem('fujiActivities') || '[]',
  )
  activities.push(activity)
  localStorage.setItem('fujiActivities', JSON.stringify(activities))
}

export async function getActivities(): Promise<Activity[]> {
  if (typeof window === 'undefined') return []
  const network = await getNetwork()
  return JSON.parse(localStorage.getItem('fujiActivities') || '[]').filter(
    (activity: Activity) => activity.contract.network === network,
  )
}
