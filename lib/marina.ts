import * as ecc from 'tiny-secp256k1'
import { BIP32Factory } from 'bip32'
import { Pset } from 'liquidjs-lib'
import { Asset } from './types'
import {
  detectProvider,
  MarinaProvider,
  Balance,
  Utxo,
  NetworkString,
  Transaction,
  AccountType,
  AccountID,
  Address,
  SentTransaction,
} from 'marina-provider'
import {
  defaultNetwork,
  marinaFujiAccountID,
  marinaLegacyMainAccountID,
  marinaMainAccountID,
  marinaTestnetMainAccountID,
} from 'lib/constants'

export async function getBalances(): Promise<Balance[]> {
  const marina = await getMarinaProvider()
  if (!marina) return []
  if (!(await marina.isEnabled())) return []
  const mainAccountIDs = await getMainAccountIDs()
  return marina.getBalances(mainAccountIDs)
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

// always returns MainAccountID xpubkey
// if you want the testnet xpubkey, use marina.getAccountInfo(marinaMainTestnetAccountID)
export async function getMainAccountXPubKey(): Promise<string> {
  const marina = await getMarinaProvider()
  if (marina) {
    const info = await marina.getAccountInfo(marinaMainAccountID)
    return info.masterXPub
  }
  return ''
}

async function getCoins(accountID: string): Promise<Utxo[]> {
  const marina = await getMarinaProvider()
  if (!marina) return []
  return await marina.getCoins([accountID])
}

export async function getMainAccountCoins(): Promise<Utxo[]> {
  const marina = await getMarinaProvider()
  if (!marina) return []
  const mainAccountIDs = await getMainAccountIDs()
  return await marina.getCoins(mainAccountIDs)
}

export async function getFujiCoins(): Promise<Utxo[]> {
  return getCoins(marinaFujiAccountID)
}

export async function getTransactions(): Promise<Transaction[]> {
  const marina = await getMarinaProvider()
  if (!marina) return []
  return marina.getTransactions()
}

export async function signTx(partialTransaction: string) {
  // check for marina
  const marina = await getMarinaProvider()
  if (!marina) throw new Error('Please install Marina')

  // sign transaction
  const ptx = Pset.fromBase64(partialTransaction)
  return await marina.signTransaction(ptx.toBase64())
}

export async function createFujiAccount(marina: MarinaProvider) {
  await marina.createAccount(marinaFujiAccountID, AccountType.Ionio)
}

export async function fujiAccountMissing(
  marina: MarinaProvider,
): Promise<boolean> {
  const accountIDs = await marina.getAccountsIDs()
  return !accountIDs.includes(marinaFujiAccountID)
}

export async function getNextAddress(accountID?: AccountID) {
  const marina = await getMarinaProvider()
  if (!marina) throw new Error('No Marina provider found')
  const mainAccountIDs = await getMainAccountIDs(false)
  if (!accountID) accountID = mainAccountIDs[0]
  await marina.useAccount(accountID)
  const address = await marina.getNextAddress()
  if (accountID !== mainAccountIDs[0])
    await marina.useAccount(mainAccountIDs[0])
  return address
}

export async function getNextChangeAddress(accountID?: AccountID) {
  const marina = await getMarinaProvider()
  if (!marina) throw new Error('No Marina provider found')
  const mainAccountIDs = await getMainAccountIDs(false)
  if (!accountID) accountID = mainAccountIDs[0]
  await marina.useAccount(accountID)
  const address = await marina.getNextChangeAddress()
  if (accountID !== mainAccountIDs[0])
    await marina.useAccount(mainAccountIDs[0])
  return address
}

export async function getPublicKey(covenantAddress: Address): Promise<Buffer> {
  const marina = await getMarinaProvider()
  if (!marina) throw new Error('No Marina provider found')
  const { masterXPub } = await marina.getAccountInfo(
    covenantAddress.accountName,
  )
  if (!covenantAddress.derivationPath)
    throw new Error(
      'unable to find derivation path used by Marina to generate borrowerPublicKey',
    )
  return BIP32Factory(ecc)
    .fromBase58(masterXPub)
    .derivePath(covenantAddress.derivationPath.replace('m/', '')).publicKey // remove m/ from path
}

export async function getMainAccountIDs(
  withLegacy = true,
): Promise<AccountID[]> {
  const network = await getNetwork()
  const mainAccounts = withLegacy ? [marinaLegacyMainAccountID] : []
  return mainAccounts.concat(
    network === 'liquid' ? marinaMainAccountID : marinaTestnetMainAccountID,
  )
}

export async function broadcastTx(rawTxHex: string): Promise<SentTransaction> {
  const marina = await getMarinaProvider()
  if (!marina) throw new Error('No Marina provider found')
  return marina.broadcastTransaction(rawTxHex)
}
