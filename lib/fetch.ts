import { fetchTxHex } from 'ldk'
import { NetworkString } from 'marina-provider'
import { explorerURL } from './explorer'
import { sleep } from './utils'

export async function fetchURL(url: string) {
  const res = await fetch(url)
  if (res.ok) return await res.json()
}

export async function postData(url: string, data = {}) {
  const res = await fetch(url, {
    body: JSON.stringify(data),
    headers: { 'Content-Type': 'application/json' },
    method: 'POST',
  })
  if (!res.ok) {
    const errorMessage = await res.text()
    throw new Error(`${res.statusText}: ${errorMessage}`)
  }
  return await res.json()
}

// fetch tx hex
// sometimes the explorer still doesnt' have the tx available,
// so we retry up to 10 times to fetch it
export async function fetchHex(txid: string, network: NetworkString) {
  for (let i = 0; i < 10; i++) {
    try {
      return await fetchTxHex(txid, explorerURL(network))
    } catch (_) {
      await sleep(1000) // wait 1 second
    }
  }
  return ''
}
