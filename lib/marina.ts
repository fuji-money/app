import { Asset, UtxoWithBlindPrivKey } from './types'
import {
  detectProvider,
  MarinaProvider,
  Balance,
  Utxo,
  AddressInterface,
  NetworkString,
  Transaction,
} from 'marina-provider'
import {
  defaultNetwork,
  marinaFujiAccountID,
  marinaMainAccountID,
} from 'lib/constants'
import { synthAssetArtifact } from 'lib/artifacts'
import { Psbt, address } from 'liquidjs-lib'
import { sleep } from './utils'

export async function getBalances(): Promise<Balance[]> {
  const marina = await getMarinaProvider()
  if (!marina) return []
  if (!(await marina.isEnabled())) return []
  return await marina.getBalances([marinaMainAccountID])
}

export function getAssetBalance(asset: Asset, balances: Balance[]): number {
  const found = balances.find((a) => a.asset.assetHash === asset.id)
  if (!found || !found.amount) return 0
  return found.amount
}

export async function getMarinaProvider(): Promise<MarinaProvider | undefined> {
  if (typeof window === 'undefined') return undefined
  try {
    return await detectProvider('marina')
  } catch {
    console.info('Please install Marina extension')
    return undefined
  }
}

export async function getNetwork(): Promise<NetworkString> {
  const marina = await getMarinaProvider()
  if (marina) return await marina.getNetwork()
  return defaultNetwork
}

export async function getXPubKey(): Promise<string> {
  const marina = await getMarinaProvider()
  if (marina) {
    const info = await marina.getAccountInfo(marinaMainAccountID)
    return info.masterXPub
  }
  return ''
}

export async function getCoins(accountID: string): Promise<Utxo[]> {
  const marina = await getMarinaProvider()
  if (!marina) return []
  return await marina.getCoins([accountID])
}

export async function getFujiCoins(): Promise<Utxo[]> {
  return await getCoins(marinaFujiAccountID)
}

export async function getTransactions(): Promise<Transaction[]> {
  const marina = await getMarinaProvider()
  if (!marina) return []
  return await marina.getTransactions()
}

export async function signTx(partialTransaction: string) {
  // check for marina
  const marina = await getMarinaProvider()
  if (!marina) throw new Error('Please install Marina')

  // sign transaction
  const ptx = Psbt.fromBase64(partialTransaction)
  return await marina.signTransaction(ptx.toBase64())
}

export async function createFujiAccount(marina: MarinaProvider) {
  console.log('createAccount')
  await marina.createAccount(marinaFujiAccountID)
  console.log('useAccount')
  await marina.useAccount(marinaFujiAccountID)
  console.log('importTemplate', synthAssetArtifact)
  await marina.importTemplate({
    type: 'ionio-artifact',
    template: JSON.stringify(synthAssetArtifact),
  })
  console.log('useAccount')
  await marina.useAccount(marinaMainAccountID)
}

export async function fujiAccountMissing(
  marina: MarinaProvider,
): Promise<boolean> {
  const accountIDs = await marina.getAccountsIDs()
  return !accountIDs.includes(marinaFujiAccountID)
}

export async function getNextAddress(accountID = marinaMainAccountID) {
  const marina = await getMarinaProvider()
  if (!marina) throw new Error('No Marina provider found')
  if (accountID === marinaMainAccountID) return await marina.getNextAddress()
  await marina.useAccount(accountID)
  const address = await marina.getNextAddress()
  await marina.useAccount(marinaMainAccountID)
  return address
}

export async function getNextChangeAddress(accountID = marinaMainAccountID) {
  const marina = await getMarinaProvider()
  if (!marina) throw new Error('No Marina provider found')
  if (accountID === marinaMainAccountID)
    return await marina.getNextChangeAddress()
  await marina.useAccount(accountID)
  const address = await marina.getNextChangeAddress()
  await marina.useAccount(marinaMainAccountID)
  return address
}
