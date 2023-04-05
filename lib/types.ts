import type { ReactElement, ReactNode } from 'react'
import type { NextPage } from 'next'
import type { AppProps } from 'next/app'

export type NextPageWithLayout = NextPage & {
  getLayout?: (page: ReactElement) => ReactNode
}

export type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout
}

export enum ActivityType {
  Creation = 'Creation',
  Redeemed = 'Redeemed',
  Liquidated = 'Liquidated',
  Topup = 'Topup',
}

export interface Activity {
  contract: Contract
  createdAt: number
  message: string
  network: string
  txid: string
  type: string
}

export interface Asset {
  icon: string
  id: string
  isSynthetic: boolean
  isAvailable: boolean
  name: string
  precision: number
  quantity: number
  ratio?: number
  ticker: string
  value: number
}

export enum ContractState {
  Critical = 'critical',
  Liquidated = 'liquidated',
  Redeemed = 'closed',
  Safe = 'safe',
  Topup = 'topuped',
  Unconfirmed = 'unconfirmed',
  Unknown = 'unknown',
  Unsafe = 'unsafe',
}

export type OracleAttestation = {
  signature: string
  message: string
  messageHash: string
}

export type ContractParams = {
  // contract constructor
  borrowAsset: string
  borrowAmount: number
  issuerPublicKey: string
  borrowerPublicKey: string
  oraclePublicKey: string
  priceLevel: string
  setupTimestamp: string
}

export enum ContractStatus {
  PROPOSED, // when contract is accepted and returned to the borrower
  COMPLETED, // when contract is detected on the chain
  CLOSED, // when contract is closed, either by redeem or topup
  EXPIRED, // when contract PROPOSED is not broadcatsed after expiration timeout
  LIQUIDATED, // when contract is liquidated
}

export type ContractResponse = {
  // outpoint tx:vout
  id: string
  // status
  status: ContractStatus
  // blockchain data
  txID: string
  vout: number
  scriptPubKey: string
  collateralAmount: number
  collateralAsset: string
  // pset
  partialTransaction: string
  // expiration timestamp
  expirationTimestamp: number
} & ContractParams

export interface Contract {
  collateral: Asset
  confirmed?: boolean
  contractParams?: ContractParams
  createdAt?: number
  expirationDate?: number
  network?: string
  oracles: string[]
  payout: number
  payoutAmount?: number
  priceLevel?: number
  state?: ContractState
  synthetic: Asset
  txid?: string
  vout?: number
  xPubKey?: string
}

export interface Investment {
  asset: Asset
  delta: number
  quantity: number
}

export interface Offer {
  id: string
  collateral: Asset
  oracles: string[]
  payout: number
  synthetic: Asset
  isAvailable: boolean
}

export interface Oracle {
  id: string
  name: string
  disabled: boolean
}

export interface Stock {
  asset: Asset
  delta: number
}

export type Ticker = string

export enum TradeTypes {
  Buy = 'Buy',
  None = 'None',
  Sell = 'Sell',
  Statement = 'Statement',
}

export enum Outcome {
  Success = 'success',
  Failure = 'failure',
}

export type BoltzSwapInfo = {
  id?: string
  currency?: string
  redeemScript?: string
  privateKey: string
  timeoutBlockHeight?: number
}

export type SwapInfo = {
  boltzRefund: BoltzSwapInfo
  contractId: string
  publicKey: string
  status: string | undefined
  task: string
  timestamp?: number
  when?: Date
}

// from https://electrumx.readthedocs.io/en/latest/protocol-methods.html#blockchain-scripthash-listunspent
export type ElectrumUnspent = {
  height: number
  tx_hash: string
  tx_pos: number
  value: number
}

export type VoidOrUndefFunc = (() => void) | undefined

export interface BlockHeader {
  height: number
  merkleRoot: string
  previousBlockHash: string
  timestamp: number
  version: number
}
