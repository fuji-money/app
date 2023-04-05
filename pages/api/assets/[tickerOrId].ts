// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'
import { apiAssets } from 'lib/server'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const tickerOrId = req.query.tickerOrId as string
  const asset = (await apiAssets()).find(
    (a) =>
      a.ticker.toLowerCase() === tickerOrId.toLowerCase() ||
      a.id === tickerOrId,
  )
  if (!asset) return res.status(404)
  res.status(200).json(asset)
}
