import type { NextApiRequest, NextApiResponse } from 'next'
import { Asset } from 'lib/types'
import { apiAssets } from 'lib/server'
import { getBalance } from 'lib/marina'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Asset[]>,
) {
  const assets = (await apiAssets()).map((asset: Asset) => {
    asset.quantity = getBalance(asset.ticker)
    return asset
  })
  res.status(200).json(assets)
}
