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
  txid: string
  type: string
}

export interface Asset {
  icon: string
  id: string
  isSynthetic: boolean
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
  Redeemed = 'redeemed',
  Unknown = 'unknown',
}

export interface Contract {
  collateral: Asset
  payout: number
  synthetic: Asset
  priceLevel?: number
  oracles: string[]
  createdAt?: number
  state?: ContractState
  txid?: string
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
}

export interface Oracle {
  id: string
  name: string
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
