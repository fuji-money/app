import { address, crypto, Psbt, Transaction } from 'liquidjs-lib'
import { NetworkString } from 'marina-provider'
import { ElectrumUnspent, ElectrumUtxo } from './types'

export const electrumURL = (network: NetworkString) => {
  switch (network) {
    case 'regtest':
      return 'http://localhost:3001' // TODO
    case 'testnet':
      return 'wss://blockstream.info/liquidtestnet/electrum-websocket/api'
    default:
      return 'wss://blockstream.info/liquid/electrum-websocket/api'
  }
}

interface callWSProps {
  id: number
  method: string
  network: NetworkString
  params: string[]
}

// sends message to web socket
// opens socket, sends paylod and deal with error
const callWS = async ({
  id,
  method,
  network,
  params,
}: callWSProps): Promise<any> => {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(electrumURL(network))
    ws.onopen = () => {
      ws.send(
        JSON.stringify({
          id,
          jsonrpc: '2.0',
          method,
          params,
        }),
      )
    }
    ws.onmessage = (e) => {
      const data = JSON.parse(e.data)
      if (data.error) {
        ws.close()
        reject(data.error)
      }
      if (data.id === id) {
        ws.close()
        resolve(data)
      }
    }
  })
}

export const reverseScriptHash = (addr: string) =>
  crypto.sha256(address.toOutputScript(addr)).reverse().toString('hex')

// finalize transaction
export const finalizeTx = (ptx: string): string => {
  const finalPtx = Psbt.fromBase64(ptx)
  finalPtx.finalizeAllInputs()
  return finalPtx.extractTransaction().toHex()
}

// broadcasts raw transaction using web sockets
// finalize inputs and then broadcast
// returns txid
export const broadcastTx = async (
  rawHex: string,
  network: NetworkString,
): Promise<any> => {
  return await callWS({
    id: 10,
    method: 'blockchain.transaction.broadcast',
    network,
    params: [rawHex],
  })
}

// given a txid, returns tx hex
export const fetchTxHex = async (
  txid: string,
  network: NetworkString,
): Promise<string> => {
  const data = await callWS({
    id: 20,
    method: 'blockchain.transaction.get',
    network,
    params: [txid],
  })
  return data.result
}

// given an address, return utxos
export const fetchUtxos = async (
  addr: string,
  network: NetworkString,
): Promise<ElectrumUtxo[]> => {
  // call web socket to get utxos
  const data = await callWS({
    id: 30,
    method: 'blockchain.scripthash.listunspent',
    network,
    params: [reverseScriptHash(addr)],
  })

  return Promise.all(
    data.result.map(async (unspent: ElectrumUnspent) => {
      const hex = await fetchTxHex(unspent.tx_hash, network)
      const prevout = Transaction.fromHex(hex).outs[unspent.tx_pos]
      return {
        txid: unspent.tx_hash,
        vout: unspent.tx_pos,
        prevout,
      }
    }),
  )
}
