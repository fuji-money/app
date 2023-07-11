import { Asset, ContractParams } from './types'
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
} from 'marina-provider'
import { Artifact } from '@ionio-lang/ionio'
import { Wallet, WalletType } from './wallet'
import { closeModal, openModal } from './utils'
import { ModalIds } from 'components/modals/modal'

export class MarinaWallet implements Wallet {
  static FujiAccountID = 'fuji' // slip13(fuji)
  static MainAccountID = 'mainAccount' // m/84'/1776'/0'
  static TestnetMainAccountID = 'mainAccountTest' // m/84'/1'/0'
  static LegacyMainAccountID = 'mainAccountLegacy' // m/44'/0'/0'

  type = WalletType.Marina
  _isConnected = false
  _xPub: string | undefined // always main account, is the "ID" of the marina wallet

  private constructor(private marina: MarinaProvider) {}

  static async detect(): Promise<MarinaWallet | undefined> {
    const marina = await detectProvider('marina')
    if (!marina) return undefined
    const instance = new MarinaWallet(marina)
    instance._isConnected = await instance.marina.isEnabled()
    if (!instance._isConnected) await instance.connect()
    const infos = await instance.marina.getAccountInfo(MarinaWallet.MainAccountID)
    instance._xPub = infos.masterXPub
    return instance
  }

  isConnected(): boolean {
    return this._isConnected
  }

  async connect(): Promise<void> {
    await this.marina.enable()

    if (await fujiAccountMissing(this.marina)) {
      openModal(ModalIds.Account)
      await createFujiAccount(this.marina)
      closeModal(ModalIds.Account)
    }

    this._isConnected = true
  }

  async disconnect(): Promise<void> {
    await this.marina.disable()
    this._isConnected = false
  }

  getMainAccountXPubKey(): string {
    return this._xPub ?? ''
  }

  async getBalances(): Promise<Balance[]> {
    if (!this._isConnected) return []
    const network = await this.getNetwork()
    const mainAccountIDs = await getMainAccountIDs(network)
    return this.marina.getBalances(mainAccountIDs)
  }

  getCoins(): Promise<Utxo[]> {
    return this.marina.getCoins()
  }

  getTransactions(): Promise<Transaction[]> {
    return this.marina.getTransactions()
  }

  getNetwork(): Promise<NetworkString> {
    return this.marina.getNetwork()
  }

  signPset(psetBase64: string): Promise<string> {
    return this.marina.signTransaction(psetBase64)
  }

  async getNextAddress(): Promise<Address> {
    const network = await this.getNetwork()
    const account = network === 'liquid' ? MarinaWallet.MainAccountID : MarinaWallet.TestnetMainAccountID
    await this.marina.useAccount(account)
    return this.marina.getNextAddress()
  }

  async getNextChangeAddress(): Promise<Address> {
    const network = await this.getNetwork()
    const account = network === 'liquid' ? MarinaWallet.MainAccountID : MarinaWallet.TestnetMainAccountID
    await this.marina.useAccount(account)
    return this.marina.getNextChangeAddress()
  }

  async getNextCovenantAddress(
    artifact: Artifact,
    params: Omit<ContractParams, 'borrowerPublicKey'>,
  ): Promise<Address> {
  await this.marina.useAccount(MarinaWallet.FujiAccountID)
  const covenantAddress = await this.marina.getNextAddress({
    artifact,
    args: params,
  })
  return covenantAddress
  }

  onSpentUtxo(callback: (utxo: Utxo) => void): () => void {
    const id = this.marina.on('SPENT_UTXO', callback)
    return () => this.marina.off(id)
  }

  onNewUtxo(callback: (utxo: Utxo) => void): () => void {
    const id = this.marina.on('NEW_UTXO', callback)
    return () => this.marina.off(id)
  }

  onNetworkChange(callback: (network: NetworkString) => void): () => void {
    const id = this.marina.on('NETWORK', callback)
    return () => this.marina.off(id)
  }
}

export function getAssetBalance(asset: Asset, balances: Balance[]): number {
  const found = balances.find((a) => a.asset.assetHash === asset.id)
  if (!found || !found.amount) return 0
  return found.amount
}

export async function createFujiAccount(marina: MarinaProvider) {
  await marina.createAccount(MarinaWallet.FujiAccountID, AccountType.Ionio)
}

export async function fujiAccountMissing(
  marina: MarinaProvider,
): Promise<boolean> {
  const accountIDs = await marina.getAccountsIDs()
  return !accountIDs.includes(MarinaWallet.FujiAccountID)
}

async function getMainAccountIDs(
  network: NetworkString,
  withLegacy = true,
): Promise<AccountID[]> {
  const mainAccounts = withLegacy ? [MarinaWallet.LegacyMainAccountID] : []
  return mainAccounts.concat(
    network === 'liquid' ? MarinaWallet.MainAccountID : MarinaWallet.TestnetMainAccountID,
  )
}
