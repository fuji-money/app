import { ActivityType, Asset, Contract, ContractState } from './types'
import Decimal from 'decimal.js'
import { minDustLimit } from './constants'
import { fetchAsset } from './api'
import { getNetwork, getXPubKey } from './marina'
import {
  updateContractOnStorage,
  addContractToStorage,
  getMyContractsFromStorage,
} from './storage'
import { addActivity, removeActivities } from './activities'

// check if a contract is redeemed or liquidated
export const contractIsClosed = (contract: Contract): boolean => {
  if (!contract.state) return false
  return [ContractState.Redeemed, ContractState.Liquidated].includes(
    contract.state,
  )
}

// get contract ratio
export const getContractRatio = (contract: Contract): number => {
  const { collateral, synthetic } = contract
  const collateralAmount = Decimal.mul(
    collateral.value,
    collateral.quantity || 0,
  )
  const syntheticAmount = Decimal.mul(synthetic.value, synthetic.quantity || 0)
  return collateralAmount.div(syntheticAmount).mul(100).toNumber()
}

// get ratio state
export const getRatioState = (
  ratio: number,
  minRatio: number,
): ContractState => {
  if (ratio >= minRatio + 50) return ContractState.Safe
  if (ratio >= minRatio + 25) return ContractState.Unsafe
  if (ratio >= minRatio) return ContractState.Critical
  return ContractState.Liquidated
}

// get contract state
export const getContractState = (contract: Contract): ContractState => {
  const { state, confirmed, collateral } = contract
  if (state === ContractState.Liquidated) return ContractState.Liquidated
  if (state === ContractState.Redeemed) return ContractState.Redeemed
  if (state === ContractState.Unknown) return ContractState.Unknown
  if (state === ContractState.Topup) return ContractState.Topup
  if (!confirmed) return ContractState.Unconfirmed
  if (!collateral?.ratio) return ContractState.Unknown
  // possible states are safe, unsafe, critical or liquidated (based on ratio)
  const ratio = getContractRatio(contract)
  return getRatioState(ratio, collateral.ratio)
}

// calculate collateral needed for this synthetic and ratio
export const getCollateralQuantity = (
  contract: Contract,
  ratio: number,
): number => {
  const { collateral, synthetic } = contract
  return Decimal.ceil(
    Decimal.mul(synthetic.quantity || 0, synthetic.value)
      .mul(ratio)
      .div(100)
      .div(collateral.value),
  ).toNumber()
}

// get contract payout
export const getContractPayoutAmount = (
  contract: Contract,
  quantity?: number,
): number => {
  const collateralAmount = quantity || contract.collateral.quantity || 0
  if (!collateralAmount) return 0
  const payout = contract.payout || 0.25 // default is 25 basis points, 0.25%
  return Decimal.ceil(
    Decimal.mul(collateralAmount, payout).div(100).add(minDustLimit),
  ).toNumber()
}

// get contract price level
export const getContractPriceLevel = (asset: Asset, ratio: number): number => {
  if (!asset.ratio) throw new Error('Asset without minimum ratio')
  return Decimal.ceil(
    Decimal.mul(asset.value, asset.ratio).div(ratio),
  ).toNumber()
}

// get all contacts belonging to this xpub and network
export async function getContracts(): Promise<Contract[]> {
  if (typeof window === 'undefined') return []
  const network = await getNetwork()
  const xPubKey = await getXPubKey()
  const promises = getMyContractsFromStorage(network, xPubKey).map(
    async (contract: Contract) => {
      const collateral = await fetchAsset(contract.collateral.ticker)
      const synthetic = await fetchAsset(contract.synthetic.ticker)
      if (!collateral)
        throw new Error(
          `Contract with unknown collateral ${contract.collateral.ticker}`,
        )
      if (!synthetic)
        throw new Error(
          `Contract with unknown synthetic ${contract.synthetic.ticker}`,
        )
      contract.collateral = { ...collateral, ...contract.collateral }
      contract.synthetic = { ...synthetic, ...contract.synthetic }
      contract.state = getContractState(contract)
      return contract
    },
  )
  return Promise.all(promises)
}

// get contract with txid
export async function getContract(txid: string): Promise<Contract | undefined> {
  const contracts = await getContracts()
  return contracts.find((c) => c.txid === txid)
}

// add contract to storage and create activity
export function createNewContract(contract: Contract): void {
  addContractToStorage(contract)
  addActivity(contract, ActivityType.Creation, Date.now())
}

// mark contract as confirmed
// this happens when we query the explorer and tx is defined
export function markContractConfirmed(contract: Contract): void {
  if (contract.confirmed) return
  contract.confirmed = true
  updateContractOnStorage(contract)
}

// mark contract as unconfirmed
// this happens when we query the explorer and tx is unconfirmed
export function markContractUnconfirmed(contract: Contract): void {
  if (!contract.confirmed) return
  contract.confirmed = false
  updateContractOnStorage(contract)
}

// mark contract as redeemed
// this happens when we query the explorer and tx is spent,
// and the spent tx used the 'redeem' function of the covenant
// note: deletes all activites with (now) invalid activity type
//   - if now is redeemed, it can't be liquidated
//   - if now is redeemed, it can't be topuped
export function markContractRedeemed(contract: Contract, tx?: any): void {
  const createdAt = tx?.status.block_time * 1000 || Date.now()
  if (contract.state === ContractState.Redeemed) return
  contract.state = ContractState.Redeemed
  updateContractOnStorage(contract)
  addActivity(contract, ActivityType.Redeemed, createdAt)
  // contract could have wrong activities due to network failures, etc.
  removeActivities(contract, ActivityType.Liquidated)
  removeActivities(contract, ActivityType.Topup)
}

// mark contract as liquidated
// this happens when we query the explorer and tx is spent,
// and the spent tx used the 'liquidate' function of the covenant
// note: deletes all activites with (now) invalid activity type
//   - if now is liquidated, it can't be redeemed
//   - it can be topupped though
export function markContractLiquidated(contract: Contract, tx: any): void {
  if (contract.state === ContractState.Liquidated) return
  contract.state = ContractState.Liquidated
  updateContractOnStorage(contract)
  addActivity(contract, ActivityType.Liquidated, tx.status.block_time * 1000)
  // contract could have wrong activities due to network failures, etc.
  removeActivities(contract, ActivityType.Redeemed)
}

// mark contract as open
// this happens when we query the explorer and tx is unspent,
// note: deletes all activites with (now) invalid activity type
//   - if now is open, it can't be liquidated
//   - if now is open, it can't be redeemed
//   - if now is open, it can't be topuped
export function markContractOpen(contract: Contract): void {
  if (!contract.state) return
  contract.state = undefined
  updateContractOnStorage(contract)
  // contract could have wrong activities due to network failures, etc.
  removeActivities(contract, ActivityType.Liquidated)
  removeActivities(contract, ActivityType.Redeemed)
  removeActivities(contract, ActivityType.Topup)
}

// mark contract as unknown
// this happens when we query the explorer and tx is unspent,
// but we don't seem to find the coin that allows to redeem it
// note: deletes all activites with (now) invalid activity type
//   - if now is open, it can't be liquidated
//   - if now is open, it can't be redeemed
//   - if now is open, it can't be topuped
export function markContractUnknown(contract: Contract): void {
  if (contract.state === ContractState.Unknown) return
  contract.state = ContractState.Unknown
  updateContractOnStorage(contract)
  // contract could have wrong activities due to network failures, etc.
  removeActivities(contract, ActivityType.Liquidated)
  removeActivities(contract, ActivityType.Redeemed)
  removeActivities(contract, ActivityType.Topup)
}
