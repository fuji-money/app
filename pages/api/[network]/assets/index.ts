import type { NextApiRequest, NextApiResponse } from 'next'
import { Asset } from 'lib/types'
import { apiAssets } from 'lib/server'
import { NetworkString } from 'marina-provider'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Asset[]>,
) {
  const network = req.query.network as NetworkString
  res.status(200).json(await apiAssets(network))
}
