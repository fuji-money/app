import { fetchAsset } from './api'
import { ActivityType, Contract, ContractState } from './types'
import { addActivity } from './activities'
import Decimal from 'decimal.js'
import { toSatoshis } from './utils'
import { getNetwork } from './marina'

export async function getContracts(): Promise<Contract[]> {
  if (typeof window === 'undefined') return []
  const network = (await getNetwork()) || 'testnet' // TODO
  const key = 'fujiContracts'
  if (!localStorage.getItem(key)) return []
  const contracts = JSON.parse(localStorage.getItem(key) || '[]')
  const promises = contracts
    .filter((contract: Contract) => contract.network === network)
    .map(async (contract: Contract) => {
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
      return contract
    })
  return Promise.all(promises)
}

export async function getContract(txid: string): Promise<Contract | undefined> {
  const contracts = await getContracts()
  return contracts.find((c) => c.txid === txid)
}

export async function addContract(contract: Contract): Promise<void> {
  if (typeof window === 'undefined') return
  const contracts = await getContracts()
  contracts.push(contract)
  localStorage.setItem('fujiContracts', JSON.stringify(contracts))
  addActivity(contract, ActivityType.Creation)
}

export async function redeemContract(contract: Contract): Promise<void> {
  if (typeof window === 'undefined') return
  const contracts = (await getContracts()).map((c) => {
    if (c.txid === contract.txid) c.state = ContractState.Redeemed
    return c
  })
  localStorage.setItem('fujiContracts', JSON.stringify(contracts))
  addActivity(contract, ActivityType.Redeemed)
}

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
export const getContractPayout = (contract: Contract): number => {
  const collateralAmount = toSatoshis(contract.collateral.quantity || 0)
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
