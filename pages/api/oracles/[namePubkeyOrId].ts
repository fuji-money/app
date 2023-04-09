// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'
import { apiOracles } from 'lib/server'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const namePubkeyOrId = req.query.namePubkeyOrId as string
  const oracle = apiOracles().find(
    (o) =>
      o.id.toLowerCase() === namePubkeyOrId.toLowerCase() ||
      o.name === namePubkeyOrId ||
      o.pubkey === namePubkeyOrId,
  )
  if (!oracle) return res.status(404)
  res.status(200).json(oracle)
}
