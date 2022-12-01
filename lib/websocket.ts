import { address, crypto, Psbt, Transaction } from 'liquidjs-lib'
import { NetworkString } from 'marina-provider'
import { BlockHeader, Contract, ElectrumUnspent, ElectrumUtxo } from './types'

// docs at https://electrumx.readthedocs.io/en/latest/protocol-methods.html

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
  params: any[]
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

// given an address, returns its script hash reversed
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
const fetchTxHex = async (
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

// given a txid, return Transaction
const fetchTx = async (
  txid: string,
  network: NetworkString,
): Promise<Transaction> => {
  const hex = await fetchTxHex(txid, network)
  return Transaction.fromHex(hex)
}

// given an address, return history
const fetchHistory = async (addr: string, network: NetworkString) => {
  // call web socket to get history
  const data = await callWS({
    id: 30,
    method: 'blockchain.scripthash.get_history',
    network,
    params: [reverseScriptHash(addr)],
  })
  return data.result
}

// given an address, return history
const fetchBlockHeader = async (height: number, network: NetworkString) => {
  // call web socket to get history
  const data = await callWS({
    id: 40,
    method: 'blockchain.block.header',
    network,
    params: [height],
  })
  return data.result
}

// deserializes a block header
const deserializeBlockHeader = (hex: string): BlockHeader => {
  const DYNAFED_HF_MASK = 2147483648
  const buffer = Buffer.from(hex, 'hex')
  let offset = 0

  let version = buffer.readUInt32LE(offset)
  offset += 4

  const isDyna = (version & DYNAFED_HF_MASK) !== 0
  if (isDyna) {
    version = version & ~DYNAFED_HF_MASK
  }

  const previousBlockHash = buffer
    .subarray(offset, offset + 32)
    .reverse()
    .toString('hex')
  offset += 32

  const merkleRoot = buffer.subarray(offset, offset + 32).toString('hex')
  offset += 32

  const timestamp = buffer.readUInt32LE(offset)
  offset += 4

  const height = buffer.readUInt32LE(offset)
  offset += 4

  return {
    height,
    merkleRoot,
    previousBlockHash,
    timestamp,
    version,
  }
}

// checks if a given contract was already spent
// 1. fetch the contract funding transaction
// 2. because we need the covenant script
// 3. to calculate the corresponding address
// 4. to fetch this address history
// 5. to find out if it is already spent (history length = 2)
// 6. If is spent, we need to fetch the block header
// 7. because we need to know when was the spending tx
// 8. and we get it by deserialing the block header
// 9. Return the input where the utxo is used
export const checkOutspend = async (
  contract: Contract,
  network: NetworkString,
) => {
  const { txid, vout } = contract
  if (!txid || typeof vout === 'undefined') return
  const tx = await fetchTx(txid, network)
  const script = tx.outs?.[vout]?.script
  if (script) {
    const addr = address.fromOutputScript(script)
    const hist = await fetchHistory(addr, network)
    if (!hist) return // tx not found
    if (hist.length === 1) return { spent: false }
    const { height, tx_hash } = hist[1] // spending tx
    // get timestamp from block header
    const { timestamp } = deserializeBlockHeader(
      await fetchBlockHeader(height, network),
    )
    // return input from tx where contract was spent, we need this
    // to find out how it was spent (liquidated, topup or redeemed)
    // by analysing the taproot leaf used
    const new_tx = await fetchTx(tx_hash, network)
    for (let vin = 0; vin < new_tx.ins.length; vin++) {
      if (txid === new_tx.ins[vin].hash.reverse().toString('hex')) {
        return {
          input: new_tx.ins[vin],
          spent: true,
          timestamp,
        }
      }
    }
  }
}

export const txIsConfirmed = async (txid: string, network: NetworkString) => {
  const tx = await fetchTx(txid, network)
  const script = tx.outs?.[0].script
  const addr = address.fromOutputScript(script)
  const hist = await fetchHistory(addr, network)
  return hist?.[0].height !== 0
}
