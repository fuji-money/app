import type { NextApiRequest, NextApiResponse } from 'next'
import { Asset } from 'lib/types'
import { apiAssets } from 'lib/server'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Asset[]>,
) {
  res.status(200).json(await apiAssets())
}
