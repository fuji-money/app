import Decimal from 'decimal.js'
import { Contract, ContractState } from './types'

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
  return Decimal.mul(synthetic.quantity || 0, synthetic.value)
    .mul(ratio)
    .div(100)
    .div(collateral.value)
    .toNumber()
}

// open modal
export const openModal = (id: string): void => {
  document.getElementById(id)?.classList.add('is-active')
}

// close modal
export const closeModal = (id: string): void => {
  document.getElementById(id)?.classList.remove('is-active')
}
