import { fetchAsset } from './api'
import { ActivityType, Contract, ContractState } from './types'
import { addActivity } from './activities'
import { getFujiCoins, getNetwork, getXPubKey } from './marina'

const localStorageKey = 'fujiContracts'

const fixMissingXPubKeyOnOldContracts = (xPubKey: string) => {
  let changed = false
  const storedContracts = localStorage.getItem(localStorageKey)
  if (!storedContracts) return
  // fix missing xPubKey on old contracts and store on local storage
  const contracts = JSON.parse(storedContracts).map((c: Contract) => {
    if (!c.xPubKey) {
      c.xPubKey = xPubKey
      changed = true
    }
    return c
  })
  if (changed) localStorage.setItem(localStorageKey, JSON.stringify(contracts))
}

export async function getContractsFromStorage(): Promise<Contract[]> {
  if (typeof window === 'undefined') return []
  const network = await getNetwork()
  const xPubKey = await getXPubKey()
  const fujiCoins = await getFujiCoins()
  fixMissingXPubKeyOnOldContracts(xPubKey) // TODO temporary hack
  const storedContracts = localStorage.getItem(localStorageKey)
  if (!storedContracts) return []
  const contracts = JSON.parse(storedContracts)
  const promises = contracts
    .filter((contract: Contract) => contract.network === network)
    .filter((contract: Contract) => contract.xPubKey === xPubKey)
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
      // if no coin found and the contract was not redeemed,
      // we'll assume this contract was liquidated
      //
      // TODO check the actual outpoint from exploer for "spentness" 
      // the element before the last in the witness stack is the script hex
      // If we decode that script, we can "fingerprint" knonw opcodes of liquidation script path spend
      const hasCoin = fujiCoins.find((c) => c.txid === contract.txid)
      if (!hasCoin && contract.state !== ContractState.Redeemed)
        contract.state = ContractState.Liquidated
      return contract
    })
  return Promise.all(promises)
}

export async function getContractFromStorage(
  txid: string,
): Promise<Contract | undefined> {
  const contracts = await getContractsFromStorage()
  return contracts.find((c) => c.txid === txid)
}

export async function addContractToStorage(contract: Contract): Promise<void> {
  if (typeof window === 'undefined') return
  const contracts = await getContractsFromStorage()
  contracts.push(contract)
  localStorage.setItem(localStorageKey, JSON.stringify(contracts))
  addActivity(contract, ActivityType.Creation)
}

export async function redeemContractToStorage(
  contract: Contract,
): Promise<void> {
  if (typeof window === 'undefined') return
  const contracts = (await getContractsFromStorage()).map((c) => {
    if (c.txid === contract.txid) c.state = ContractState.Redeemed
    return c
  })
  localStorage.setItem(localStorageKey, JSON.stringify(contracts))
  addActivity(contract, ActivityType.Redeemed)
}
