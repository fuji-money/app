import { Artifact } from '@ionio-lang/ionio';
import type { Address, Balance, NetworkString, Transaction, Utxo } from 'marina-provider'
import { ContractParams } from './types';

export enum WalletType {
  Marina = 'marina',
  Alby = 'alby',
}

export interface Wallet {
    type: WalletType;
    isConnected(): boolean;
    
    connect(): Promise<void>;
    disconnect(): Promise<void>;

    getMainAccountXPubKey(): string;
    getBalances(): Promise<Balance[]>;
    getCoins(): Promise<Utxo[]>;
    getTransactions(): Promise<Transaction[]>;
    getNetwork(): Promise<NetworkString>;

    getNextAddress(): Promise<Address>;
    getNextChangeAddress(): Promise<Address>;
    getNextCovenantAddress(
      artifact: Artifact,
      params: Omit<ContractParams, 'borrowerPublicKey'> // wallet should "inject" the borrower public key parameter
    ): Promise<Address>;

    signPset(psetBase64: string): Promise<string>;

    onSpentUtxo(callback: (utxo: Utxo) => void): () => void;
    onNewUtxo(callback: (utxo: Utxo) => void): () => void;
    onNetworkChange(callback: (network: NetworkString) => void): () => void;
}
