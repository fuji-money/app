// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'
import { Offer } from 'lib/types'
import { apiOffers } from 'lib/server'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Offer[]>,
) {
  res.status(200).json(await apiOffers())
}
