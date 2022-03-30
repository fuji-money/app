export interface Asset {
  icon: string;
  id: string;
  isSynthetic: boolean;
  name: string;
  quantity?: number;
  ratio?: number;
  ticker: string;
  value: number;
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
  collateral: Asset;
  quantity: number;
  ratio: number;
  synthetic: Asset;
  id: string;
}

export type Ticker = string;
