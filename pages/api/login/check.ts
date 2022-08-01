import type { NextApiRequest, NextApiResponse } from 'next'
import { userNotAllowed } from 'lib/auth'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  // only posts with body allowed
  if (req.method !== 'POST' || !req.body) return res.status(405).end()

  const cookies = req.body

  res.status(200).json(!userNotAllowed(cookies))
}
