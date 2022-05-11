import { fetchURL } from "./fetch"

const lbtc = {
  icon: '/images/assets/lbtc.svg',
  id: '144c654344aa716d6f3abcc1ca90e5641e4e2a7f633bc09fe3baf64585819a49',
  isSynthetic: false,
  name: 'Liquid BTC',
  precision: 8,
  ratio: 200,
  ticker: 'LBTC',
  value: 40000,
}

const usdt = {
  icon: '/images/assets/usdt.svg',
  id: 'f3d1ec678811398cd2ae277cbe3849c6f6dbd72c74bc542f7c4b11ff0e820958',
  isSynthetic: false,
  name: 'Tether USD',
  precision: 8,
  ratio: 150,
  ticker: 'USDt',
  value: 1,
}

const fusd = {
  icon: '/images/assets/fusd.svg',
  id: '04e28b858766654440399712cfcd49bcfa512971b7e79cd4029dbb23d18cd568',
  isSynthetic: true,
  name: 'FUJI USD',
  precision: 8,
  ticker: 'fUSD',
  value: 1,
}

const fbmn = {
  icon: '/images/assets/fbmn.svg',
  id: '0256e332a5134f31dbea899e0cb7c75d3e2cff969d3958d066f8198caaee3a61',
  isSynthetic: true,
  name: 'FUJI BMN',
  precision: 8,
  ticker: 'fBMN',
  value: 309415.05,
}

export const apiAssets = [lbtc, usdt, fusd, fbmn]

export const apiOffers = [
  {
    id: '5530bdbb7c61227eac28429debef062c845f829522280612c5dd9f5e1a2082ee',
    collateral: lbtc,
    payout: 0.25,
    synthetic: fusd,
  },
  {
    id: '30c044bbf89dab097ccf7cab1c297a95727f4f39a4c3e37d9619708e9d902f27',
    collateral: lbtc,
    payout: 0.25,
    synthetic: fbmn,
  },
  {
    id: '30c044bbf89dab097ccf7cab1c297a95727f4f39a4c3e37d9619708e9d902f27',
    collateral: usdt,
    payout: 0.25,
    synthetic: fbmn,
  },
]

export const findAssetByTicker = (ticker: any) => {
  return apiAssets.find(
    (asset) => asset.ticker.toLowerCase() === ticker.toLowerCase(),
  )
}

export const getBTCvalue = async () => {
  const data = await fetchURL('https://api.coindesk.com/v1/bpi/currentprice.json')
  return data.bpi.USD.rate_float
}
