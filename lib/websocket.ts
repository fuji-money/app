import { address, crypto, Transaction } from 'liquidjs-lib'
import { Input } from 'liquidjs-lib/src/transaction'
import { NetworkString, Utxo } from 'marina-provider'
import { getContractCovenantAddress } from './contracts'
import { BlockHeader, Contract, ElectrumUnspent } from './types'

// docs at https://electrumx.readthedocs.io/en/latest/protocol-methods.html

// returns electrum url based on network
const electrumURL = (network: NetworkString): string => {
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
  method: string
  network: NetworkString
  params: any[]
}

// sends message to web socket
// opens socket, sends paylod and deal with error
const callWS = async ({
  method,
  network,
  params,
}: callWSProps): Promise<any> => {
  return new Promise((resolve, reject) => {
    const id = Math.floor(Math.random() * 1_000)
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

// given a txid, returns tx hex
const fetchTxHex = async (
  txid: string,
  network: NetworkString,
): Promise<string> => {
  const data = await callWS({
    method: 'blockchain.transaction.get',
    network,
    params: [txid],
  })
  return data.result
}

// given a txid, returns a Transaction
const fetchTx = async (
  txid: string,
  network: NetworkString,
): Promise<Transaction | undefined> => {
  const hex = await fetchTxHex(txid, network)
  if (!hex) return
  return Transaction.fromHex(hex)
}

// returns history for a given contract
// useful to see if a contract is confirmed and spent
const fetchContractHistory = async (
  contract: Contract,
  network: NetworkString,
) => {
  // get address for this contract
  const addr = await getContractCovenantAddress(contract, network)
  if (!addr) return
  // call web socket to get history
  const data = await callWS({
    method: 'blockchain.scripthash.get_history',
    network,
    params: [reverseScriptHash(addr)],
  })
  return data.result
}

// given a block height returns block header
const fetchBlockHeader = async (height: number, network: NetworkString) => {
  // call web socket to get history
  const data = await callWS({
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

// given an address, returns its script hash reversed
const reverseScriptHash = (addr: string): string =>
  crypto.sha256(address.toOutputScript(addr)).reverse().toString('hex')

// given an address, return utxos
export const fetchUtxosForAddress = async (
  addr: string,
  network: NetworkString,
): Promise<Omit<Utxo, 'scriptDetails'>[]> => {
  // call web socket to get utxos
  const data = await callWS({
    method: 'blockchain.scripthash.listunspent',
    network,
    params: [reverseScriptHash(addr)],
  })

  return Promise.all(
    data.result.map(async (unspent: ElectrumUnspent) => {
      const hex = await fetchTxHex(unspent.tx_hash, network)
      const witnessUtxo = Transaction.fromHex(hex).outs[unspent.tx_pos]
      return {
        txid: unspent.tx_hash,
        vout: unspent.tx_pos,
        witnessUtxo,
      }
    }),
  )
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
export const checkContractOutspend = async (
  contract: Contract,
  network: NetworkString,
): Promise<
  | {
      spent: boolean
      input?: Input
      timestamp?: number
    }
  | undefined
> => {
  const hist = await fetchContractHistory(contract, network)
  if (!hist || hist.length === 0) return // tx not found, not even on mempool
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
  if (!new_tx) return
  for (let vin = 0; vin < new_tx.ins.length; vin++) {
    if (contract.txid === new_tx.ins[vin].hash.reverse().toString('hex')) {
      return {
        input: new_tx.ins[vin],
        spent: true,
        timestamp,
      }
    }
  }
}

// check if a contract is confirmed by analysing its history
export const checkContractIsConfirmed = async (
  contract: Contract,
  network: NetworkString,
): Promise<boolean> => {
  const hist = await fetchContractHistory(contract, network)
  return hist && hist[0] && hist[0].height !== 0
}

// given an address, resolve when tx is at least on mempool
export const waitForAddressAvailable = async (
  addr: string,
  network: NetworkString,
): Promise<any> => {
  return new Promise((resolve, reject) => {
    if (!addr) reject('address not found')
    const id = Math.floor(Math.random() * 1_000)
    const reversedScriptHash = reverseScriptHash(addr)
    const ws = new WebSocket(electrumURL(network))
    // subscribe changes
    ws.onopen = () => {
      ws.send(
        JSON.stringify({
          id,
          jsonrpc: '2.0',
          method: 'blockchain.scripthash.subscribe',
          params: [reversedScriptHash],
        }),
      )
    }
    // listen for messages
    ws.onmessage = async (e) => {
      const data = JSON.parse(e.data)
      if (data.error) {
        ws.close()
        reject(data.error)
      }
      if (data.params) {
        // unsubscribe and close websocket
        ws.send(
          JSON.stringify({
            id,
            jsonrpc: '2.0',
            method: 'blockchain.scripthash.unsubscribe',
            params: [reversedScriptHash],
          }),
        )
        ws.close()
        resolve(data)
      }
    }
  })
}

// given an address, resolve when tx is confirmed
//
// subscribe responds in this order:
// 1. {id, jsonrpc: '2.0', result: null} - ack for subscription
// 2. {jsonrpc: '2.0', method, params: Array(2)} - tx is on mempool
// 3. {jsonrpc: '2.0', method, params: Array(2)} - tx is confirmed
//
// to distinguish from 2. and 3. calculate the mempool status and check
// if it's present on params[1] (if so, is mempool, else is confirmed)
export const waitForContractConfirmation = async (
  contract: Contract,
  network: NetworkString,
): Promise<any> => {
  const covenantAddress = await getContractCovenantAddress(contract, network)
  return new Promise((resolve) => {
    const { txid } = contract
    if (!txid) throw new Error('txid not found')
    if (!covenantAddress) throw new Error('covenant address not found')
    // https://electrumx.readthedocs.io/en/latest/protocol-basics.html#status
    const mempoolStatus = crypto
      .sha256(Buffer.from(`${txid}:0:`))
      .toString('hex')
    const id = Math.floor(Math.random() * 1_000)
    const reversedScriptHash = reverseScriptHash(covenantAddress)
    const ws = new WebSocket(electrumURL(network))
    // subscribe changes
    ws.onopen = () => {
      ws.send(
        JSON.stringify({
          id,
          jsonrpc: '2.0',
          method: 'blockchain.scripthash.subscribe',
          params: [reversedScriptHash],
        }),
      )
    }
    // listen for messages
    ws.onmessage = async (e) => {
      const data = JSON.parse(e.data)
      if (data.params && data.params.length > 1) {
        if (data.params[1] !== mempoolStatus) {
          // unsubscribe and close websocket
          ws.send(
            JSON.stringify({
              id,
              jsonrpc: '2.0',
              method: 'blockchain.scripthash.unsubscribe',
              params: [reversedScriptHash],
            }),
          )
          ws.close()
          resolve(data)
        }
      }
    }

    ws.onerror = (e) => {
      console.error(e)
      ws.close()
    }
  })
}
