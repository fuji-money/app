import type { NextApiRequest, NextApiResponse } from 'next'
import { calcAuthCookie } from 'lib/auth'
import { fetchURL } from 'lib/fetch'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  // only posts with body allowed
  if (req.method !== 'POST' || !req.body) return res.status(405).end()

  const email = req.body
  const vipList = JSON.parse(process.env.VIP_LIST || '[]')

  const success = () => res.status(200).json(calcAuthCookie(email))

  if (vipList.includes(email)) return success()

  const maxOrder = process.env.VIRAL_LOOP_MAX_ORDER
  const publicToken = process.env.VIRAL_LOOP_PUBLIC_TOKEN

  const url =
    'https://app.viral-loops.com/api/v3/campaign/participant/order?' +
    `publicToken=${publicToken}&` +
    `email=${email}`

  const data = await fetchURL(url)

  // if valid email, return cookie value to be set client side
  if (maxOrder && data.order <= maxOrder) return success()

  // email not in vip list, return 401
  return res.status(401).end()
}
