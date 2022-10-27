import { Psbt } from 'liquidjs-lib'
import { NetworkString } from 'marina-provider'
import { sleep } from './utils'

export const electrumURL = (network: NetworkString) => {
  switch (network) {
    case 'regtest':
      return 'http://localhost:3001' // TODO
    case 'testnet':
      return 'wss://esplora.blockstream.com/liquidtestnet/electrum-websocket/api'
    default:
      return 'wss://esplora.blockstream.com/liquid/electrum-websocket/api'
  }
}

export async function broadcastTx(
  partialTransaction: string,
  network: NetworkString,
): Promise<any> {
  // finalize transaction
  const finalPtx = Psbt.fromBase64(partialTransaction)
  finalPtx.finalizeAllInputs()
  const rawHex = finalPtx.extractTransaction().toHex()
  console.info('rawHex', rawHex)
  // broadcast transaction
  return await new Promise((resolve, reject) => {
    const ws = new WebSocket(electrumURL(network))
    ws.onopen = () => {
      ws.send(
        JSON.stringify({
          id: 1,
          method: 'blockchain.transaction.broadcast',
          params: [rawHex],
        }),
      )
    }
    ws.onmessage = (e) => {
      ws.close()
      const data = JSON.parse(e.data)
      if (data.error) reject(data.error)
      resolve(data)
    }
  })
}
