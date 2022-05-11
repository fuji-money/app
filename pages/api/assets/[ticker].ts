// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'
import { findAssetByTicker } from 'lib/server'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { ticker } = req.query
  const asset = await findAssetByTicker(ticker)
  if (!asset) return res.status(404)
  res.status(200).json(asset)
}
