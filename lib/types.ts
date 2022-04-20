import type { ReactElement, ReactNode } from 'react'
import type { NextPage } from 'next'
import type { AppProps } from 'next/app'

export type NextPageWithLayout = NextPage & {
  getLayout?: (page: ReactElement) => ReactNode
}

export type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout
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
}

export interface Contract {
  collateral: Asset
  payout: number
  synthetic: Asset
  createdAt?: number
  state?: ContractState
  txid?: string
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

export interface Offer {
  id: string
  collateral: Asset
  payout: number
  synthetic: Asset
}

export type Ticker = string
