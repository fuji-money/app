// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'
import { Offer } from 'lib/types'
import { apiOffers } from 'lib/server'
import { NetworkString } from 'marina-provider'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Offer[]>,
) {
  const network = req.query.network as NetworkString
  res.status(200).json(await apiOffers(network))
}
