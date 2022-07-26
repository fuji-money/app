import { fetchAsset } from './api'
import { ActivityType, Contract, ContractState } from './types'
import { addActivity } from './activities'
import Decimal from 'decimal.js'
import { toSatoshis } from './utils'
import { getNetwork } from './marina'

export const contractIsExpired = (contract: Contract): boolean => {
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
  if (!contract?.collateral?.ratio) return ContractState.Unknown
  const ratio = getContractRatio(contract)
  return getRatioState(ratio, contract.collateral.ratio)
}

// calculate collateral needed for this synthetic and ratio
export const getCollateralQuantity = (
  contract: Contract,
  ratio: number,
): number => {
  const { collateral, synthetic } = contract
  return Math.ceil(
    Decimal.mul(synthetic.quantity || 0, synthetic.value)
      .mul(ratio)
      .div(100)
      .div(collateral.value)
      .toNumber(),
  )
}

// get contract payout
export const getContractPayout = (contract: Contract, quantity?: number): number => {
  const collateralAmount = quantity || contract.collateral.quantity || 0
  return Math.ceil(collateralAmount * 0.0025) // 25 basis points, 0.25%
}

// get contract price level
export const getContractPriceLevel = (
  contract: Contract,
  ratio: number,
): number => {
  const { collateral } = contract
  if (!collateral.ratio) throw new Error('Collateral without minimum ratio')
  return Math.ceil((collateral.value * collateral.ratio) / ratio)
}
