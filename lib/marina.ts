import * as ecc from 'tiny-secp256k1'
import { Asset, ContractParams } from './types'
import {
  detectProvider,
  MarinaProvider,
  NetworkString,
  AccountType,
  AccountID,
  Address,
  isIonioScriptDetails,
  Utxo,
} from 'marina-provider'
import { Artifact, Contract as IonioContract } from '@ionio-lang/ionio'
import { Coin, Wallet, WalletType } from './wallet'
import { closeModal, openModal } from './utils'
import { ModalIds } from 'components/modals/modal'
import { BIP32Factory } from 'bip32'

function isCoin(utxo: Utxo): utxo is Coin {
  return utxo.witnessUtxo !== undefined
}

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
    if (!instance.isConnected()) await instance.connect()
    const infos = await instance.marina.getAccountInfo(
      MarinaWallet.MainAccountID,
    )
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

  async getBalances(): Promise<Record<string, number>> {
    if (!this.isConnected) return {}
    const network = await this.getNetwork()
    const mainAccountIDs = await getMainAccountIDs(network)
    const marinaBalances = await this.marina.getBalances(mainAccountIDs)

    const balances: Record<string, number> = {}

    for (const balance of marinaBalances) {
      balances[balance.asset.assetHash] = balance.amount
    }

    return balances
  }

  async getCoins(): Promise<Coin[]> {
    const marinaCoins = await this.marina.getCoins()
    return marinaCoins.filter(isCoin)
  }

  getNetwork(): Promise<NetworkString> {
    return this.marina.getNetwork()
  }

  signPset(psetBase64: string): Promise<string> {
    return this.marina.signTransaction(psetBase64)
  }

  private async getNextMainAddress(): Promise<Address> {
    const network = await this.getNetwork()
    const account =
      network === 'liquid'
        ? MarinaWallet.MainAccountID
        : MarinaWallet.TestnetMainAccountID
    await this.marina.useAccount(account)
    return this.marina.getNextAddress()
  }

  async getNextAddress(): Promise<string> {
    const address = await this.getNextMainAddress()
    return address.confidentialAddress
  }

  async getNewPublicKey(): Promise<string> {
    const newAddress = await this.getNextMainAddress()
    if (!newAddress.derivationPath) throw new Error('Invalid derivation path')
    const accountInfos = await this.marina.getAccountInfo(
      newAddress.accountName,
    )

    return BIP32Factory(ecc)
      .fromBase58(accountInfos.masterXPub) // derive from fuji account
      .derivePath(newAddress.derivationPath.replace('m/', '')) // use the new derivation path
      .publicKey.toString('hex')
  }

  async getNextChangeAddress(): Promise<string> {
    const network = await this.getNetwork()
    const account =
      network === 'liquid'
        ? MarinaWallet.MainAccountID
        : MarinaWallet.TestnetMainAccountID
    await this.marina.useAccount(account)
    const { confidentialAddress } = await this.marina.getNextChangeAddress()
    return confidentialAddress
  }

  async getNextCovenantAddress(
    artifact: Artifact,
    params: Omit<ContractParams, 'borrowerPublicKey'>,
  ): Promise<{
    contract: IonioContract
    confidentialAddress: string
    contractParams: ContractParams
  }> {
    await this.marina.useAccount(MarinaWallet.FujiAccountID)
    const covenantAddress = await this.marina.getNextAddress({
      artifact,
      args: params,
    })

    if (!covenantAddress.contract) throw new Error('Contract not found')
    if (!isIonioScriptDetails(covenantAddress))
      throw new Error('Invalid contract')
    if (!covenantAddress.derivationPath)
      throw new Error('Invalid derivation path')

    // recompute the borrowerPublicKey
    const accountInfos = await this.marina.getAccountInfo(
      MarinaWallet.FujiAccountID,
    )
    const key = BIP32Factory(ecc)
      .fromBase58(accountInfos.masterXPub) // derive from fuji account
      .derivePath(covenantAddress.derivationPath.replace('m/', '')) // use the new derivation path
      .publicKey.subarray(1) // remove the prefix (0x02 or 0x03)
      .toString('hex')

    return {
      contract: covenantAddress.contract,
      confidentialAddress: covenantAddress.confidentialAddress,
      contractParams: {
        ...params,
        borrowerPublicKey: `0x${key}`,
      },
    }
  }

  onSpentUtxo(callback: (utxo: Coin) => void): () => void {
    const id = this.marina.on('SPENT_UTXO', ({ data }: { data: Coin }) =>
      callback(data),
    )
    return () => this.marina.off(id)
  }

  onNewUtxo(callback: (utxo: Coin) => void): () => void {
    const id = this.marina.on('NEW_UTXO', ({ data }: { data: Coin }) =>
      callback(data),
    )
    return () => this.marina.off(id)
  }
}

export function getAssetBalance(
  asset: Asset,
  balances?: Record<string, number>,
): number {
  if (!balances) return 0
  const found = balances[asset.id]
  if (!found) return 0
  return found
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
    network === 'liquid'
      ? MarinaWallet.MainAccountID
      : MarinaWallet.TestnetMainAccountID,
  )
}
