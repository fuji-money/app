import type { ReactElement, ReactNode } from 'react'
import type { NextPage } from 'next'
import type { AppProps } from 'next/app'
import { Utxo } from 'marina-provider'

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
  quantity?: number
  ratio?: number
  ticker: string
  value: number
}

export enum ContractState {
  Safe = 'safe',
  Unsafe = 'unsafe',
  Critical = 'critical',
  Liquidated = 'liquidated',
  Redeemed = 'closed',
  Unknown = 'unknown',
}

export interface Contract {
  borrowerPubKey?: string
  collateral: Asset
  contractParams?: any // TODO
  createdAt?: number
  network?: string
  oracles: string[]
  payout: number
  payoutAmount?: number
  priceLevel?: number
  state?: ContractState
  synthetic: Asset
  txid?: string
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

export type UtxoWithBlindPrivKey = Utxo & {
  blindPrivKey?: string
}
