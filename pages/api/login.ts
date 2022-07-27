import type { NextApiRequest, NextApiResponse } from 'next'
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  console.log('req.headers.authorization', req.headers.authorization)
  if (req.method !== 'POST') return res.status(405).end()

  return res.status(401).end()

  // exchange the DID from Magic for some user data
  // const did = magic.utils.parseAuthorizationHeader(req.headers.authorization)
  // const user = await magic.users.getMetadataByToken(did)

  console.log('api login req', req.body)

  // Author a couple of cookies to persist a users session
   // TODO

   res.end()
}
