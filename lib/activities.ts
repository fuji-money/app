import { prettyAsset } from './pretty'
import { randomTxId } from './random'
import { Activity, ActivityType, Contract } from './types'

export function addActivity(contract: Contract, type: ActivityType): void {
  if (typeof window === 'undefined') return
  const txid = contract.txid || randomTxId() // TODO
  const prefix = `Contract ${type.toLowerCase()} with success`
  const suffix = prettyAsset(contract.synthetic)
  const message = `${prefix} - ${suffix}`
  const activity: Activity = {
    contract,
    createdAt: Date.now(),
    message,
    txid,
    type,
  }
  const activities: Activity[] = JSON.parse(
    localStorage.getItem('fujiActivities') || '[]',
  )
  activities.push(activity)
  localStorage.setItem('fujiActivities', JSON.stringify(activities))
}

export function getActivities(): Activity[] {
  if (typeof window === 'undefined') return []
  return JSON.parse(localStorage.getItem('fujiActivities') || '[]')
}
