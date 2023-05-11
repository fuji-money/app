import type { NextApiRequest, NextApiResponse } from 'next'
import { Stock } from 'lib/types'
import { apiStocks } from 'lib/server'
import { NetworkString } from 'marina-provider'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Stock[]>,
) {
  const network = req.query.network as NetworkString
  res.status(200).json(apiStocks(network))
}
