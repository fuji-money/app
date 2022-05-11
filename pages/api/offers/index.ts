// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'
import { Offer, Ticker } from 'lib/types'
import { apiAssets, apiOffers } from 'lib/server'

const finder = (ticker: Ticker) =>
  apiAssets.find((asset) => asset.ticker === ticker)

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<Offer[]>,
) {
  const offers = apiOffers.map((offer) => {
    const collateral = finder(offer.collateral.ticker)
    const synthetic = finder(offer.synthetic.ticker)
    if (!collateral || !synthetic) throw new Error('Offer with unknown asset')
    return { ...offer, collateral, synthetic }
  })
  res.status(200).json(offers)
}
