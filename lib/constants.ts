export const minBorrowRatio = 150
export const maxBorrowRatio = 400
export const minMultiplyRatio = 130
export const maxMultiplyRatio = 330

// marina account IDs
export const marinaFujiAccountID = 'fuji'
export const marinaMainAccountID = 'mainAccount'

export const defaultNetwork = 'testnet'

// covenant
export const issuerPubKey =
  '0209bf6ee287df1803f7ce4de36ad2bd0d78a42808249b1639463ee62731e22956'
export const oraclePubKey =
  '02c304c3b5805eecff054c319c545dc6ac2ad44eb70f79dd9570e284c5a62c0f9e'

export const fUSDtestnet =
  process.env.NEXT_PUBLIC_FUSD_ASSET_ID ||
  '0d86b2f6a8c3b02a8c7c8836b83a081e68b7e2b4bcdfc58981fc5486f59f7518'

export const oracleURL =
  process.env.NEXT_PUBLIC_ORACLE_URL ||
  'https://oracle.fuji.money/oracle/BTCUSD' // TODO - remove alternative url
export const alphaServerUrl =
  process.env.NEXT_PUBLIC_FACTORY_URL || 'https://alpha-factory.fuji.money' // TODO - remove alternative url

export const minDustLimit = 500
export const feeAmount = 500 // fee for regular liquid tx
export const swapFeeAmount = 500 // fee for Boltz

export const twitterMessage = `I'm using @fuji_money to borrow Fuji USD with #Bitcoin collateral.\n\n💸 No recurring interest\n🥷 No intermediaries\n🏃‍♀️ Redeem anytime\n\nCheck it out!\n\nhttps://fuji.money`
