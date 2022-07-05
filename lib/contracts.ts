import { fetchAsset } from './api'
import { ActivityType, Contract, ContractState } from './types'
import { addActivity } from './activities'
import { getContractState } from './utils'

export async function getContracts(): Promise<Contract[]> {
  if (typeof window === 'undefined') return []
  const key = 'fujiContracts'
  if (!localStorage.getItem(key)) return []
  const contracts = JSON.parse(localStorage.getItem(key) || '[]')
  const promises = contracts.map(async (contract: Contract) => {
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
  return [ContractState.Redeemed, ContractState.Liquidated].includes(contract.state)
}
