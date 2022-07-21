import type { NextApiRequest, NextApiResponse } from 'next'
import { Asset } from 'lib/types'
import { apiAssets } from 'lib/server'
import { getBalance } from 'lib/marina'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Asset[]>,
) {
  const assets = await apiAssets()
  const promises = assets.map(async (asset: Asset) => {
    asset.quantity = await getBalance(asset)
    return asset
  })
  res.status(200).json(await Promise.all(promises))
}
