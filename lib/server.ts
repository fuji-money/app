import { fetchURL } from './fetch'
import { Asset, Offer, Oracle } from './types'

const lbtc: Asset = {
  icon: '/images/assets/lbtc.svg',
  id: '144c654344aa716d6f3abcc1ca90e5641e4e2a7f633bc09fe3baf64585819a49',
  isSynthetic: false,
  name: 'Liquid BTC',
  precision: 8,
  ratio: 200,
  ticker: 'LBTC',
  value: 40000,
}

const usdt: Asset = {
  icon: '/images/assets/usdt.svg',
  id: 'f3d1ec678811398cd2ae277cbe3849c6f6dbd72c74bc542f7c4b11ff0e820958',
  isSynthetic: false,
  name: 'Tether USD',
  precision: 8,
  ratio: 150,
  ticker: 'USDt',
  value: 1,
}

const fusd: Asset = {
  icon: '/images/assets/fusd.svg',
  id: '04e28b858766654440399712cfcd49bcfa512971b7e79cd4029dbb23d18cd568',
  isSynthetic: true,
  name: 'FUJI USD',
  precision: 8,
  ticker: 'fUSD',
  value: 1,
}

const fbmn: Asset = {
  icon: '/images/assets/fbmn.svg',
  id: '0256e332a5134f31dbea899e0cb7c75d3e2cff969d3958d066f8198caaee3a61',
  isSynthetic: true,
  name: 'FUJI BMN',
  precision: 8,
  ticker: 'fBMN',
  value: 309415.05,
}

const oracles: Oracle[] = [
  { id: 'id1', name: 'provider 1' },
  { id: 'id2', name: 'provider 2' },
  { id: 'id3', name: 'provider 3' },
  { id: 'id4', name: 'provider 4' },
]

export const apiAssets = async (): Promise<Asset[]> => {
  lbtc.value = await getBTCvalue()
  return [lbtc, usdt, fusd, fbmn]
}

export const apiOffers = async (): Promise<Offer[]> => [
  {
    id: '5530bdbb7c61227eac28429debef062c845f829522280612c5dd9f5e1a2082ee',
    collateral: await findAssetByTicker('lbtc'),
    oracles: [oracles[0].id],
    payout: 0.25,
    synthetic: await findAssetByTicker('fusd'),
  },
  {
    id: '30c044bbf89dab097ccf7cab1c297a95727f4f39a4c3e37d9619708e9d902f27',
    collateral: await findAssetByTicker('lbtc'),
    oracles: [oracles[0].id],
    payout: 0.25,
    synthetic: await findAssetByTicker('fbmn'),
  },
  {
    id: '30c044bbf89dab097ccf7cab1c297a95727f4f39a4c3e37d9619708e9d902f27',
    collateral: await findAssetByTicker('usdt'),
    oracles: [oracles[0].id],
    payout: 0.25,
    synthetic: await findAssetByTicker('fbmn'),
  },
]

export const apiOracles = (): Oracle[] => oracles

export const findAssetByTicker = async (ticker: string): Promise<Asset> => {
  const asset = (await apiAssets()).find(
    (a) => a.ticker.toLowerCase() === ticker.toLowerCase(),
  )
  if (!asset) throw new Error(`Asset with ticker ${ticker} not found`)
  return asset
}

export const getBTCvalue = async (): Promise<number> => {
  const data = await fetchURL(
    'https://api.coindesk.com/v1/bpi/currentprice.json',
  )
  return Number(data.bpi.USD.rate_float)
}
