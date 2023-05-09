// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'
import { apiOracles } from 'lib/server'
import { NetworkString } from 'marina-provider'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const network = req.query.network as NetworkString
  const namePubkeyOrId = req.query.namePubkeyOrId as string
  const oracle = apiOracles(network).find(
    (o) =>
      o.id.toLowerCase() === namePubkeyOrId.toLowerCase() ||
      o.name === namePubkeyOrId ||
      o.pubkey === namePubkeyOrId,
  )
  if (!oracle) return res.status(404)
  res.status(200).json(oracle)
}
