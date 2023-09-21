import { encodeExpirationTimeout } from './utils'

export const minBorrowRatio = 110
export const maxBorrowRatio = 400
export const safeBorrowMargin = 50
export const minMultiplyRatio = 130
export const maxMultiplyRatio = 330

// marina account IDs
export const marinaFujiAccountID = 'fuji' // slip13(fuji)
export const marinaMainAccountID = 'mainAccount' // m/84'/1776'/0'
export const marinaTestnetMainAccountID = 'mainAccountTest' // m/84'/1'/0'
export const marinaLegacyMainAccountID = 'mainAccountLegacy' // m/44'/0'/0'

export const defaultNetwork = 'liquid'

export const factoryUrlMainnet =
  process.env.NEXT_PUBLIC_FACTORY_URL || 'https://factory.fuji-labs.io'

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
