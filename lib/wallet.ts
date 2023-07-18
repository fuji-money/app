import { Artifact } from '@ionio-lang/ionio'
import type { NetworkString, UnblindedOutput } from 'marina-provider'
import { ContractParams } from './types'
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
  getCoins(): Promise<Coin[]> // returns all coins, including contract ones
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
}
