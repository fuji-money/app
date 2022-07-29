export const minMultiplyRatio = 130
export const maxMultiplyRatio = 330

// marina account IDs
export const marinaFujiAccountID = 'fuji'
export const marinaMainAccountID = 'mainAccount'

// covenant
export const issuerPubKey =
  '02a3d89442c53fa319737bce93e0408d00f817f992a276fea1a2aa0ffbdc4a8a76'
export const oraclePubKey =
  '0256e332a5134f31dbea899e0cb7c75d3e2cff969d3958d066f8198caaee3a6159'


export const fUSDtestnet = process.env.NEXT_PUBLIC_FUSD_ASSET_ID || '04e28b858766654440399712cfcd49bcfa512971b7e79cd4029dbb23d18cd568'

export const oracleURL = process.env.NEXT_PUBLIC_ORACLE_URL || 'https://oracle.fuji.money/oracle/BTCUSD' // TODO - remove alternative url
export const alphaServerUrl = process.env.NEXT_PUBLIC_FACTORY_URL || 'https://alpha-factory.fuji.money' // TODO - remove alternative url

export const minDustLimit = 500
export const feeAmount = 500

export const twitterMessage = "I'm using fuji.money, give it a try"
