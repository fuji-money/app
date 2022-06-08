import { fetchAsset } from './api'
import { randomMessage, randomTime, randomTxId } from './random'
import { Activity, ActivityType, Contract, Ticker } from './types'
import { detectProvider, MarinaProvider } from 'marina-provider'

export const getBalance = (ticker: Ticker): number => {
  switch (ticker) {
    case 'LBTC':
      return 2
    case 'USDt':
      return 42_000
    case 'fUSD':
      return 4_200
    case 'fBMN':
      return 0.001
    default:
      return 0
  }
}

export async function checkMarina(): Promise<boolean> {
  const marina = await getMarina()
  if (!marina) return false
  return await marina.isEnabled()
}

export async function getMarina(): Promise<MarinaProvider | undefined> {
  try {
    return await detectProvider('marina')
  } catch {
    console.log('Please install Marina extension')
    return undefined
  }
}

const contracts = [
  {
    collateral: {
      ticker: 'LBTC',
      quantity: 42,
    },
    createdAt: 1647874196970,
    oracles: ['id1', 'id3'],
    payout: 0.25,
    synthetic: {
      ticker: 'fBMN',
      quantity: 1,
    },
    txid: '0c5d451941f37b801d04c46920f2bc5bbd3986e5f56cb56c6b17bedc655e9fc6',
  },
  {
    collateral: {
      ticker: 'LBTC',
      quantity: 1.5,
    },
    createdAt: 1647874996970,
    oracles: ['id2', 'id3'],
    payout: 0.25,
    synthetic: {
      ticker: 'fUSD',
      quantity: 21000,
    },
    txid: '6b397062b69411b554ec398ae3b25fdc54fab1805126786581a56a7746afbab2',
  },
  {
    collateral: {
      ticker: 'USDt',
      quantity: 400000,
    },
    createdAt: 1647874906970,
    oracles: ['id2'],
    payout: 0.25,
    synthetic: {
      ticker: 'fBMN',
      quantity: 1,
    },
    txid: 'c1e117b516469e56872bb22bad278041e7596682f03aa0aa10d39dae79bfbe8f',
  },
]

export async function getContracts(): Promise<Contract[]> {
  if (!checkMarina()) return []
  const promises = contracts.map(async (contract) => {
    const collateral = await fetchAsset(contract.collateral.ticker)
    const synthetic = await fetchAsset(contract.synthetic.ticker)
    if (!collateral)
      throw new Error(
        `Contract with unknown collateral ${contract.collateral.ticker}`,
      )
    if (!synthetic)
      throw new Error(
        `Contract with unknown synthetic ${contract.synthetic.ticker}`,
      )
    contract.collateral = { ...collateral, ...contract.collateral }
    contract.synthetic = { ...synthetic, ...contract.synthetic }
    return contract as Contract
  })
  return Promise.all(promises)
}

export async function getContract(txid: string): Promise<Contract | undefined> {
  const contracts = await getContracts()
  return contracts.find((c) => c.txid === txid)
}

export async function getActivities(): Promise<Activity[]> {
  let activities: Activity[] = []
  const contracts = await getContracts()
  for (const contract of contracts) {
    for (const type in ActivityType) {
      const activity = {
        contract,
        createdAt: randomTime(),
        message: randomMessage(type),
        txid: randomTxId(),
        type: type,
      }
      activities.push(activity)
    }
  }
  return activities
}
