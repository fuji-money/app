// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'
import { Oracle } from 'lib/types'
import { apiOracles } from 'lib/server'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Oracle[]>,
) {
  res.status(200).json(await apiOracles())
}
