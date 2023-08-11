import { Artifact } from '@ionio-lang/ionio'
import type { NetworkString, UnblindedOutput } from 'marina-provider'
import { Asset, Contract, ContractParams } from './types'
import { TxOutput } from 'liquidjs-lib'

export enum WalletType {
  Marina = 'marina',
  Alby = 'alby',
}

export type Coin = UnblindedOutput & {
  witnessUtxo: TxOutput
}

export interface Wallet {
  type: WalletType
  isConnected(): boolean

  connect(): Promise<void>
  disconnect(): Promise<void>

  getMainAccountXPubKey(): string
  getBalances(): Promise<Record<string, number>>
  getCoins(): Promise<Coin[]> // returns all coins that are not locked by the covenants
  getContractCoin(txID: string, vout: number): Promise<Coin | undefined>
  getNetwork(): Promise<NetworkString>

  getNextAddress(): Promise<string>
  getNextChangeAddress(): Promise<string>
  getNextCovenantAddress(
    artifact: Artifact,
    params: Omit<ContractParams, 'borrowerPublicKey'>, // wallet should "inject" the borrower public key parameter
  ): Promise<{
    confidentialAddress: string
    contractParams: ContractParams
  }>
  getNewPublicKey(): Promise<string> // this is used mostly for Boltz

  signPset(psetBase64: string): Promise<string>

  onSpentUtxo(callback: (utxo: Coin) => void): () => void
  onNewUtxo(callback: (utxo: Coin) => void): () => void

  // getContractsFromWallet should return all contracts that are in the wallet without any call to localstorage
  // it is used to sync the wallet with the local storage (in case the user has used the app on several device)
  // *optional* if not implemented, the wallet can't sync with the local storage
  getContracts?(assets: Asset[]): Promise<Contract[]>
}
