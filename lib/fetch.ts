import { OwnedInput } from 'liquidjs-lib'
import { ContractParams, ContractResponse, OracleAttestation } from './types'

export async function fetchURL(url: string) {
  try {
    const res = await fetch(url)
    if (res.ok) return await res.json()
  } catch (ignore) {}
}

export async function postData<TResponse extends any>(
  url: string,
  data = {},
): Promise<TResponse> {
  const res = await fetch(url, {
    body: JSON.stringify(data),
    headers: { 'Content-Type': 'application/json' },
    method: 'POST',
  })
  if (!res.ok) {
    const errorMessage = await res.text()
    throw new Error(`${res.statusText}: ${errorMessage}`)
  }
  return (await res.json()) as TResponse
}

export type ProposeContractArgs = {
  partialTransaction: string
  borrowerAddress: string
  collateralAmount: number
  collateralAsset: string
  contractParams: ContractParams
  attestation: OracleAttestation
  covenantOutputIndexInTransaction: number
  blindersOfCollateralInputs: OwnedInput[]
}

export type TopupContractArgs = ProposeContractArgs & {
  blindersOfSynthInputs: OwnedInput[]
}

// this function ensures that the server receives the data in the correct format
// { type: 'Buffer', data: [1, 2, 3] } should be converted to base64 string
// Buffer & Uint8Array should be converted to base64 string
function encodeBufferAsBase64(args: Record<string, any>): Record<string, any> {
  for (const [key, value] of Object.entries(args)) {
    if (value instanceof Buffer || value instanceof Uint8Array) {
      args[key] = value.toString('base64')
    } else if (
      typeof value === 'object' &&
      value['type'] === 'Buffer' &&
      Array.isArray(value['data'])
    ) {
      args[key] = Buffer.from(value.data).toString('base64')
    } else if (typeof value === 'object') {
      args[key] = encodeBufferAsBase64(value)
    }
  }
  return args
}

export function contractsRequest(
  alphaServerURL: string,
  args: ProposeContractArgs,
) {
  return postData<ContractResponse>(
    `${alphaServerURL}/contracts`,
    encodeBufferAsBase64(args),
  )
}

export function topupRequest(
  alphaServerURL: string,
  txid: string,
  vout: number,
  args: TopupContractArgs,
) {
  return postData<ContractResponse>(
    `${alphaServerURL}/contracts/${txid}:${vout}/topup`,
    encodeBufferAsBase64(args),
  )
}
