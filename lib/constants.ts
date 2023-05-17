import { encodeExpirationTimeout } from './utils'

export const minBorrowRatio = 110
export const maxBorrowRatio = 400
export const minMultiplyRatio = 130
export const maxMultiplyRatio = 330

export const defaultPayout = 0

// marina account IDs
export const marinaFujiAccountID = 'fuji' // slip13(fuji)
export const marinaMainAccountID = 'mainAccount' // m/84'/1776'/0'
export const marinaTestnetMainAccountID = 'mainAccountTest' // m/84'/1'/0'
export const marinaLegacyMainAccountID = 'mainAccountLegacy' // m/44'/0'/0'

export const defaultNetwork = 'liquid'

// covenant
export const treasuryPublicKey =
  process.env.NEXT_PUBLIC_LIQUIDATOR_PUBKEY ||
  '03e6fbc4bcd62026a3d5a13ab8fd5b72008ff38907b2ee64de45e25263a418c377'
export const oraclePubKey =
  process.env.NEXT_PUBLIC_FUJI_LABS_ORACLE_PUBKEY ||
  'c304c3b5805eecff054c319c545dc6ac2ad44eb70f79dd9570e284c5a62c0f9e' // TODO

export const fUSDAssetId =
  process.env.NEXT_PUBLIC_FUSD_ASSET_ID ||
  '518c0b351f5731f5d40cf6ad444d1c147eda1cdf8c867185c58a526fb02ad806'

export const oracleURL =
  process.env.NEXT_PUBLIC_ORACLE_URL ||
  'https://oracle.fuji.money/oracle/BTCUSD' // TODO - remove alternative url

export const factoryUrlMainnet =
  process.env.NEXT_PUBLIC_FACTORY_URL || 'https://dev-factory.fuji.money'

export const factoryUrlTestnet =
  process.env.NEXT_PUBLIC_FACTORY_URL_TESTNET ||
  'https://stage-factory.fuji.money'

export const assetExplorerUrlMainnet =
  process.env.NEXT_PUBLIC_ASSET_EXPLORER_URL ||
  'https://blockstream.info/liquid/api/asset/'

export const assetExplorerUrlTestnet =
  process.env.NEXT_PUBLIC_ASSET_EXPLORER_URL_TESTNET ||
  'https://blockstream.info/liquidtestnet/api/asset/'

const seconds3months = 3 * 30 * 24 * 60 * 60 // 3 months
export const expirationSeconds = seconds3months - (seconds3months % 512)
export const expirationTimeout = `0x${encodeExpirationTimeout(
  expirationSeconds,
).toString('hex')}`
export const assetPair = `0x${Buffer.from('USD').toString('hex')}`

export const minDustLimit = 500
export const feeAmount = 500 // fee for regular liquid tx
export const swapFeeAmount = 500 // fee for Boltz

export const twitterMessage = `I'm using @fuji_money to borrow Fuji USD with #Bitcoin collateral.\n\n🥷 No intermediaries\n🏃‍♀️ Redeem anytime\n\nCheck it out!\n\nhttps://fuji.money`
