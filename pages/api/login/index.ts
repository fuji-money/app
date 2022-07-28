import type { NextApiRequest, NextApiResponse } from 'next'
import { calcAuthCookie } from 'lib/auth'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  // only posts with body allowed
  if (req.method !== 'POST' || !req.body) return res.status(405).end()

  const email = req.body
  const vipList = ['john@doe.com', 'easter_monolith@protonmail.com']

  // if valid email, return cookie value to be set client side
  if (vipList.includes(email))
    return res.status(200).json(calcAuthCookie(email))

  // email not in vip list, return 401
  return res.status(401).end()
}
