import type { NextApiRequest, NextApiResponse } from 'next'
import { Asset } from 'lib/types'
import { apiAssets } from 'lib/server'
import { balance } from 'lib/marina'

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<Asset[]>,
) {
  const assets = apiAssets.map((asset: Asset) => {
    asset.quantity = balance(asset.ticker)
    return asset
  })
  res.status(200).json(assets)
}
