import type { NextApiRequest, NextApiResponse } from 'next'
import { calcAuthCookie } from 'lib/auth'
import { fetchURL } from 'lib/fetch'

const onViralLoops = async (uri: string, email: string): Promise<any> => {
  const apiToken = process.env.VIRAL_LOOP_SECRET_TOKEN || ''
  const body = { participants: [{ email }] }
  const url = `https://app.viral-loops.com/api/v3/campaign/participant/${uri}`

  const res = await fetch(url, {
    body: JSON.stringify(body),
    headers: {
      apiToken,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    method: 'POST',
  })

  if (!res.ok) {
    const errorMessage = await res.text()
    console.log(`${res.statusText}: ${errorMessage}`)
    return
  }

  return await res.json()
}

const getUserRank = async (email: string) => {
  const publicToken = process.env.VIRAL_LOOP_PUBLIC_TOKEN
  const url =
    'https://app.viral-loops.com/api/v3/campaign/participant/order?' +
    `publicToken=${publicToken}&` +
    `email=${email}`
  const user = await fetchURL(url)
  return user.rank
}

const flagUser = async (email: string) => await onViralLoops('flag', email)

const userIsFlagged = async (email: string) => {
  const data = await onViralLoops('query', email)
  return data?.data[0]?.user?.excluded
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  // only posts with body allowed
  if (req.method !== 'POST' || !req.body) return res.status(405).end()

  const email = req.body
  const vipList = JSON.parse(process.env.VIP_LIST || '[]')

  // on success, return cookie value to be set client side
  const success = () => res.status(200).json(calcAuthCookie(email))
  const failure = () => res.status(401).end()

  // if user is on vip list, let him in
  if (vipList.includes(email)) return success()

  // if user was previouslly flagged, let him in
  if (await userIsFlagged(email)) return success()

  // else, check if user has rank <= max rank defined on env
  // if so, flag him and he will always be allowed to enter
  const maxRank = process.env.VIRAL_LOOP_MAX_RANK || -1
  const userRank = (await getUserRank(email)) || 0
  if (userRank <= maxRank) {
    await flagUser(email)
    return success()
  }

  // email not allowed, return 401
  return failure()
}
