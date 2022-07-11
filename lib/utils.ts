import Decimal from 'decimal.js'
import { Contract, ContractState } from './types'
import { writeUInt64LE } from 'liquidjs-lib/src/bufferutils';

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

// get contract payout
export const getContractPayout = (contract: Contract): number => {
  const collateralAmount = contract.collateral.quantity || 0
  return Math.floor(collateralAmount * 0.0025) // 25 basis points, 0.25%
}

// get contract price level
export const getContractPriceLevel = (contract: Contract, ratio: number): number => {
  const { collateral } = contract
  if (!collateral.ratio) throw new Error('Collateral without minimum ratio')
  return collateral.value * collateral.ratio / ratio
}

// number to string
export function numberToString(n: number): string {
  const num = Math.floor(n)
  const buf = Buffer.alloc(8);
  writeUInt64LE(buf, num, 0);
  return '0x'.concat(buf.toString('hex'));
}

export function toSatoshi(fractional: number, precision: number = 8): number {
  return Math.floor(new Decimal(fractional).mul(Decimal.pow(10, precision)).toNumber());
}

// open modal
export const openModal = (id: string): void => {
  document.getElementById(id)?.classList.add('is-active')
}

// close modal
export const closeModal = (id: string): void => {
  document.getElementById(id)?.classList.remove('is-active')
}
