export interface Token {
  icon: string;
  isSynthetic: boolean;
  name: string;
  ticker: string;
  value: number;
}

export interface Asset extends Token {
  quantity?: number;
  borrowTxId?: string;
}

export enum ContractState {
  Safe = 'safe',
  Unsafe = 'unsafe',
  Critical = 'critical',
  Liquidated = 'liquidated',
  Redeemed = 'redeemed',
}

export interface Contract {
  collateral: Asset;
  ratio: number;
  synthetic: Asset;
  createdAt?: number;
  state?: ContractState;
  txid?: string;
}

export enum ActivityType {
  Creation = 'Created',
  Redeemed = 'Redeemed',
  Liquidated = 'Liquidated',
  Topup = 'Top Up',
}

export interface Activity {
  contract: Contract;
  createdAt: number;
  icon: string;
  message: string;
  txid: string;
  type: ActivityType;
}

export interface Offer {
  collateral: Token[];
  quantity: number;
  synthetic: Token;
  ratio: number;
  txid: string;
}

export type Ticker = string;
