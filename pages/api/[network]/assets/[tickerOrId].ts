// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'
import { apiAssets } from 'lib/server'
import { NetworkString } from 'marina-provider'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const network = req.query.network as NetworkString
  const tickerOrId = req.query.tickerOrId as string
  const asset = (await apiAssets(network)).find(
    (a) =>
      a.ticker.toLowerCase() === tickerOrId.toLowerCase() ||
      a.id === tickerOrId,
  )
  if (!asset) return res.status(404)
  res.status(200).json(asset)
}
