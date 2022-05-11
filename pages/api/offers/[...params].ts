// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'
import { apiOffers } from 'lib/server'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { params } = req.query
  if (params.length !== 2) res.status(404).json({ message: `invalid url` })
  const offer = apiOffers.find(
    (_offer) =>
      _offer.collateral.ticker === params[1] &&
      _offer.synthetic.ticker === params[0]
  )
  if (!offer) res.status(404).json({ message: `offer not found` })
  res.status(200).json(offer)
}
