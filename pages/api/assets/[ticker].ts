// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'
import { findAssetByTicker } from 'lib/server'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { ticker } = req.query
  const asset = findAssetByTicker(ticker)
  if (!asset) res.status(404)
  res.status(200).json(asset)
}
