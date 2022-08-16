import { ActivityType, Contract, ContractState } from './types'
import Decimal from 'decimal.js'
import { minDustLimit } from './constants'
import { fetchAsset } from './api'
import { getNetwork, getXPubKey } from './marina'
import {
  updateContractOnStorage,
  addContractToStorage,
  getMyContractsFromStorage,
} from './storage'
import { addActivity } from './activities'

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
  if (contract.state === ContractState.Liquidated)
    return ContractState.Liquidated
  if (contract.state === ContractState.Redeemed) return ContractState.Redeemed
  if (!contract.confirmed) return ContractState.Unconfirmed
  if (!contract?.collateral?.ratio) return ContractState.Unknown
  // possible states are safe, unsafe, critical or liquidated (based on ratio)
  const ratio = getContractRatio(contract)
  return getRatioState(ratio, contract.collateral.ratio)
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
export const getContractPriceLevel = (
  contract: Contract,
  ratio: number,
): number => {
  const { collateral } = contract
  if (!collateral.ratio) throw new Error('Collateral without minimum ratio')
  return Decimal.ceil(
    Decimal.mul(collateral.value, collateral.ratio).div(ratio),
  ).toNumber()
}

// get all contacts belonging to this xpub and network
export async function getContracts(): Promise<Contract[]> {
  if (typeof window === 'undefined') return []
  console.log('getContracts')
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
export function createContract(contract: Contract): void {
  addContractToStorage(contract)
  addActivity(contract, ActivityType.Creation)
}

// redeem contract and create activity
export function redeemContract(contract: Contract): void {
  contract.state = ContractState.Redeemed
  updateContractOnStorage(contract)
  addActivity(contract, ActivityType.Redeemed)
}

// mark contract as confirmed
export function confirmContract(contract: Contract): void {
  console.log('confirming contract', contract.txid)
  contract.confirmed = true
  updateContractOnStorage(contract)
}

// add contract to storage and create activity
export function liquidateContract(contract: Contract): void {
  console.log('liquidating contract', contract.txid)
  contract.confirmed = true
  contract.state = ContractState.Liquidated
  updateContractOnStorage(contract)
  addActivity(contract, ActivityType.Liquidated)
}
