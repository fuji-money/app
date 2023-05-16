import { ActivityType, Asset, Contract, ContractState } from './types'
import Decimal from 'decimal.js'
import {
  assetPair,
  defaultPayout,
  expirationSeconds,
  expirationTimeout,
  minDustLimit,
} from './constants'
import { fetchAsset, fetchOracle } from './api'
import { getNetwork, getMainAccountXPubKey } from './marina'
import {
  updateContractOnStorage,
  addContractToStorage,
  getMyContractsFromStorage,
} from './storage'
import { addActivity, removeActivities } from './activities'
import { getIonioInstance } from './covenant'
import { isIonioScriptDetails, NetworkString, Utxo } from 'marina-provider'
import { fromSatoshis, hex64LEToNumber, toSatoshis } from './utils'
import { ChainSource } from './chainsource.port'
import { address, Transaction } from 'liquidjs-lib'

// checks if a given contract was already spent
// 1. fetch the contract funding transaction
// 2. because we need the covenant script
// 3. to calculate the corresponding address
// 4. to fetch this address history
// 5. to find out if it is already spent (history length = 2)
// 6. If is spent, we need to fetch the block header
// 7. because we need to know when was the spending tx
// 8. and we get it by deserialing the block header
// 9. Return the input where the utxo is used
export async function checkContractOutspend(
  chainSource: ChainSource,
  contract: Contract,
  network: NetworkString,
) {
  const covenantAddress = await getContractCovenantAddress(contract, network)
  const [hist] = await chainSource.fetchHistories([
    address.toOutputScript(covenantAddress),
  ])
  if (!hist || hist.length === 0) return // tx not found, not even on mempool
  if (hist.length === 1) return { spent: false }
  const { height, tx_hash } = hist[1] // spending tx
  // get timestamp from block header
  const { timestamp } = await chainSource.fetchBlockHeader(height)
  // return input from tx where contract was spent, we need this
  // to find out how it was spent (liquidated, topup or redeemed)
  // by analysing the taproot leaf used
  const [new_tx] = await chainSource.fetchTransactions([tx_hash])
  if (!new_tx) return
  const decodedTransaction = Transaction.fromHex(new_tx.hex)
  for (const input of decodedTransaction.ins) {
    if (contract.txid === Buffer.from(input.hash).reverse().toString('hex')) {
      return {
        input,
        spent: true,
        timestamp,
      }
    }
  }
}

// transform a fuji coin into a contract
export const coinToContract = async (
  coin: Utxo,
  network: NetworkString,
): Promise<Contract | undefined> => {
  if (
    coin.scriptDetails &&
    isIonioScriptDetails(coin.scriptDetails) &&
    coin.blindingData
  ) {
    const params = coin.scriptDetails.params
    const collateral = await fetchAsset(coin.blindingData.asset, network)
    const synthetic = await fetchAsset(params[0] as string, network)
    const oracle = await fetchOracle(params[3] as string, network)
    if (!collateral || !synthetic || !oracle) return
    const borrowAsset = params[0] as string
    const borrowAmount = params[1] as number
    const borrowerPublicKey = params[2] as string
    const oraclePublicKey = params[3] as string
    const treasuryPublicKey = params[4] as string
    const priceLevel = params[5] as string
    const setupTimestamp = params[6] as string
    const createdAt = hex64LEToNumber(setupTimestamp)
    const contract: Contract = {
      collateral: {
        ...collateral,
        quantity: coin.blindingData.value,
      },
      contractParams: {
        assetPair,
        expirationTimeout,
        borrowAsset,
        borrowAmount,
        borrowerPublicKey,
        oraclePublicKey,
        treasuryPublicKey,
        priceLevel,
        setupTimestamp,
      },
      createdAt: hex64LEToNumber(setupTimestamp),
      expirationDate: getContractExpirationDate(Math.floor(createdAt / 1000)),
      network: await getNetwork(),
      oracles: [oracle.id],
      payout: defaultPayout,
      priceLevel: hex64LEToNumber(params[5] as string),
      synthetic: {
        ...synthetic,
        quantity: params[1] as number,
      },
      txid: coin.txid,
      vout: coin.vout,
    }
    contract.payoutAmount = getContractPayoutAmount(contract)
    return contract
  }
}

// check if a contract is redeemed or liquidated
export const contractIsClosed = (contract: Contract): boolean => {
  if (!contract.state) return false
  return [
    ContractState.Redeemed,
    ContractState.Liquidated,
    ContractState.Topup,
  ].includes(contract.state)
}

// get contract ratio
export const getContractRatio = (contract?: Contract): number => {
  if (!contract) return 0
  const { collateral, synthetic } = contract
  // need to calculate in units, not in satoshis, since each asset
  // can have different precisions
  const colUnits = fromSatoshis(collateral.quantity, collateral.precision)
  const synUnits = fromSatoshis(synthetic.quantity, synthetic.precision)
  const collateralAmount = Decimal.mul(colUnits, collateral.value)
  const syntheticAmount = Decimal.mul(synUnits, synthetic.value)
  return collateralAmount.div(syntheticAmount).mul(100).toNumber()
}

// get ratio state
export const getRatioState = (
  ratio: number,
  minRatio: number,
  safeRatio?: number,
): ContractState => {
  const _safeRatio = safeRatio || minRatio + 50
  // first half between min and safe is considered critical
  // second half between min and safe is considered unsafe
  const unsafe = (_safeRatio - minRatio) / 2 + minRatio
  if (ratio >= _safeRatio) return ContractState.Safe
  if (ratio >= unsafe) return ContractState.Unsafe
  if (ratio >= minRatio) return ContractState.Critical
  if (ratio === 0) return ContractState.Unknown
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
  const synUnits = fromSatoshis(synthetic.quantity, synthetic.precision)
  const syntheticAmount = Decimal.mul(synUnits, synthetic.value)
  const colUnits = Decimal.mul(syntheticAmount, ratio)
    .div(100)
    .div(collateral.value)
    .toNumber()
  const collateralAmount = toSatoshis(colUnits, collateral.precision)
  return collateralAmount
}

// get contract payout
export const getContractPayoutAmount = (
  contract: Contract,
  quantity?: number,
): number => {
  if (defaultPayout === 0) return 0
  const collateralAmount = quantity || contract.collateral.quantity
  if (!collateralAmount) return 0
  const payout = contract.payout || defaultPayout
  return Decimal.ceil(
    Decimal.mul(collateralAmount, payout).div(100).add(minDustLimit),
  ).toNumber()
}

// get contract price level
export const getContractPriceLevel = (asset: Asset, ratio: number): number => {
  if (!asset.value) throw new Error('Asset without value')
  if (!asset.ratio) throw new Error('Asset without minimum ratio')
  return Decimal.ceil(
    Decimal.mul(asset.value, asset.ratio).div(ratio),
  ).toNumber()
}

// get all contacts belonging to this xpub and network
export async function getContracts(
  network: NetworkString,
): Promise<Contract[]> {
  if (typeof window === 'undefined') return []
  const xPubKey = await getMainAccountXPubKey()
  // cache assets for performance issues
  const assetCache = new Map<string, Asset>()
  const allTickers = new Set<string>()
  getMyContractsFromStorage(network, xPubKey).map(
    ({ collateral, synthetic }) => {
      allTickers.add(collateral.ticker)
      allTickers.add(synthetic.ticker)
    },
  )
  for (const ticker of Array.from(allTickers.values())) {
    assetCache.set(ticker, await fetchAsset(ticker, network))
  }
  const promises = getMyContractsFromStorage(network, xPubKey).map(
    async (contract: Contract) => {
      const collateral = assetCache.get(contract.collateral.ticker)
      const synthetic = assetCache.get(contract.synthetic.ticker)
      if (!collateral)
        throw new Error(
          `Contract with unknown collateral ${contract.collateral.ticker}`,
        )
      if (!synthetic)
        throw new Error(
          `Contract with unknown synthetic ${contract.synthetic.ticker}`,
        )
      contract.collateral = {
        ...collateral,
        quantity: contract.collateral.quantity,
      }
      contract.synthetic = {
        ...synthetic,
        quantity: contract.synthetic.quantity,
      }
      contract.state = getContractState(contract)
      return contract
    },
  )
  return Promise.all(promises)
}

// get contract with txid
export async function getContract(
  txid: string,
  network: NetworkString,
): Promise<Contract | undefined> {
  const contracts = await getContracts(network)
  return contracts.find((c) => c.txid === txid)
}

// add contract to storage and create activity
export function createNewContract(
  contract: Contract,
  timestamp = Date.now(),
): void {
  const clone = structuredClone(contract)
  addContractToStorage(clone)
  addActivity(clone, ActivityType.Creation, timestamp)
}

// mark contract as confirmed
// this happens when we query the explorer and tx is defined
export function markContractConfirmed(contract: Contract): void {
  if (contract.confirmed) return
  const clone = structuredClone(contract)
  clone.confirmed = true
  updateContractOnStorage(clone)
}

// mark contract as redeemed
// this happens when we query the explorer and tx is spent,
// and the spent tx used the 'redeem' function of the covenant
// note: deletes all activites with (now) invalid activity type
//   - if now is redeemed, it can't be liquidated
//   - if now is redeemed, it can't be topuped
export function markContractRedeemed(
  contract: Contract,
  timestamp?: number,
): void {
  if (contract.state === ContractState.Redeemed) return
  const clone = structuredClone(contract)
  const createdAt = timestamp ? timestamp * 1000 : Date.now()
  clone.state = ContractState.Redeemed
  updateContractOnStorage(clone)
  addActivity(clone, ActivityType.Redeemed, createdAt)
  // contract could have wrong activities due to network failures, etc.
  removeActivities(clone, ActivityType.Liquidated)
  removeActivities(clone, ActivityType.Topup)
}

// mark contract as liquidated
// this happens when we query the explorer and tx is spent,
// and the spent tx used the 'liquidate' function of the covenant
// note: deletes all activites with (now) invalid activity type
//   - if now is liquidated, it can't be redeemed
//   - it can be topupped though
export function markContractLiquidated(
  contract: Contract,
  timestamp?: number,
): void {
  if (contract.state === ContractState.Liquidated) return
  const clone = structuredClone(contract)
  const createdAt = timestamp ? timestamp * 1000 : Date.now()
  clone.state = ContractState.Liquidated
  updateContractOnStorage(clone)
  addActivity(clone, ActivityType.Liquidated, createdAt)
  // contract could have wrong activities due to network failures, etc.
  removeActivities(clone, ActivityType.Redeemed)
}

// mark contract as open
// this happens when we query the explorer and tx is unspent,
// note: deletes all activites with (now) invalid activity type
//   - if now is open, it can't be liquidated
//   - if now is open, it can't be redeemed
//   - if now is open, it can't be topuped
export function markContractOpen(contract: Contract): void {
  if (!contract.state) return
  const clone = structuredClone(contract)
  clone.state = undefined
  updateContractOnStorage(clone)
  // contract could have wrong activities due to network failures, etc.
  removeActivities(clone, ActivityType.Liquidated)
  removeActivities(clone, ActivityType.Redeemed)
  removeActivities(clone, ActivityType.Topup)
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
  const clone = structuredClone(contract)
  clone.state = ContractState.Unknown
  updateContractOnStorage(clone)
  // contract could have wrong activities due to network failures, etc.
  removeActivities(clone, ActivityType.Liquidated)
  removeActivities(clone, ActivityType.Redeemed)
  removeActivities(clone, ActivityType.Topup)
}

// mark contract as topup
export function markContractTopup(
  contract: Contract,
  timestamp?: number,
): void {
  if (contract.state === ContractState.Topup) return
  const createdAt = timestamp ? timestamp * 1000 : Date.now()
  const clone = structuredClone(contract)
  clone.state = ContractState.Topup
  updateContractOnStorage(clone)
  addActivity(clone, ActivityType.Topup, createdAt)
}

// add additional fields to contract and save to storage
export async function saveContractToStorage(
  contract: Contract,
  network: NetworkString,
): Promise<void> {
  const clone = structuredClone(contract)
  clone.network = network
  clone.confirmed = false
  clone.xPubKey = await getMainAccountXPubKey()
  createNewContract(clone)
}

export async function getContractCovenantAddress(
  contract: Contract,
  network: NetworkString,
) {
  return (await getIonioInstance(contract, network)).address
}

export function getContractExpirationDate(
  start = 0,
  validity = expirationSeconds,
) {
  const begins = start || Math.floor(Date.now() / 1000)
  return new Date((begins + validity) * 1000).getTime()
}
