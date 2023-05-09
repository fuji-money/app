import type { NextApiRequest, NextApiResponse } from 'next'
import { Stock } from 'lib/types'
import { apiStocks } from 'lib/server'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Stock[]>,
) {
  res.status(200).json(apiStocks())
}
