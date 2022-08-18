import type { NextApiRequest, NextApiResponse } from 'next'
import { Asset } from 'lib/types'
import { apiAssets } from 'lib/server'
import { getAssetBalance, getBalances } from 'lib/marina'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Asset[]>,
) {
  const assets = await apiAssets()
  const balances = await getBalances()
  const promises = assets.map(async (asset: Asset) => {
    asset.quantity = getAssetBalance(asset, balances)
    return asset
  })
  res.status(200).json(await Promise.all(promises))
}
