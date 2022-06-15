import type { NextApiRequest, NextApiResponse } from 'next'
import { Investment } from 'lib/types'
import { apiInvestments } from 'lib/server'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Investment[]>,
) {
  res.status(200).json(apiInvestments())
}
