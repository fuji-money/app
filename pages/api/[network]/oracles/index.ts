import type { NextApiRequest, NextApiResponse } from 'next'
import { Oracle } from 'lib/types'
import { apiOracles } from 'lib/server'
import { NetworkString } from 'marina-provider'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Oracle[]>,
) {
  const network = req.query.network as NetworkString
  res.status(200).json(apiOracles(network))
}
