import axios from 'axios'
import { getMainAccountCoins, getNextAddress } from 'lib/marina'
import { Contract } from 'lib/types'
import { Creator, Pset, Transaction, Updater, address } from 'liquidjs-lib'
import { NetworkString } from 'marina-provider'
import { getTradeType } from './market'
import {
  TDEXv2Market,
  TDEXv2ProposeTradeRequest,
  TDEXv2ProposeTradeResponse,
  TDEXv2SwapRequest,
  TDEXv2UnblindedInput,
} from './types'
import { makeid } from 'lib/utils'
import { PreparedBorrowTx } from 'lib/covenant'
import { fetchTradePreview } from './preview'

interface createTradeProposeRequestProps {
  amountToBeSent: number
  amountToReceive: number
  assetToBeSent: string
  assetToReceive: string
  network: NetworkString
  outpoint: { txid: string; vout: number }
}

const createTradeProposeRequest = async ({
  amountToBeSent,
  amountToReceive,
  assetToBeSent,
  assetToReceive,
  outpoint,
}: createTradeProposeRequestProps): Promise<TDEXv2SwapRequest> => {
  // build Psbt
  const pset = Creator.newPset()
  const updater = new Updater(pset)
  const unblindedInputs: TDEXv2UnblindedInput[] = []

  // select and validate we have necessary utxo
  const { txid, vout } = outpoint
  const coins = await getMainAccountCoins()
  const utxo = coins.find((u) => u.txid === txid && u.vout === vout)

  if (!utxo) throw new Error('Fuji coin not found')

  updater.addInputs([
    {
      txid: utxo.txid,
      txIndex: utxo.vout,
      witnessUtxo: utxo.witnessUtxo,
      sighashType: Transaction.SIGHASH_ALL,
    },
  ])
  if (utxo.blindingData) {
    unblindedInputs.push({
      index: 0,
      asset: utxo.blindingData.asset,
      amount: utxo.blindingData.value.toString(),
      assetBlinder: utxo.blindingData.assetBlindingFactor,
      amountBlinder: utxo.blindingData.valueBlindingFactor,
    })
  }

  // receiving script
  const receivingAddress = await getNextAddress()
  const { scriptPubKey, blindingKey } = address.fromConfidential(
    receivingAddress.confidentialAddress,
  )

  updater.addOutputs([
    {
      script: scriptPubKey,
      amount: amountToReceive,
      asset: assetToReceive,
      blinderIndex: 0,
      blindingPublicKey: blindingKey,
    },
  ])

  console.log('pset aka transaction in swap request', pset)

  const swapRequest: TDEXv2SwapRequest = {
    id: makeid(8),
    amountP: amountToBeSent.toString(),
    assetP: assetToBeSent,
    amountR: amountToReceive.toString(),
    assetR: assetToReceive,
    transaction: pset.toBase64(),
    unblindedInputs,
  }

  return swapRequest
}

const fetchTradePropose = async (
  args: TDEXv2ProposeTradeRequest,
): Promise<TDEXv2ProposeTradeResponse> => {
  const url = args.market.provider.endpoint + '/v2/trade/propose'
  const opt = { headers: { 'Content-Type': 'application/json' } }
  const res = await axios.post(url, args, opt)
  return res.data
}

export const proposeTDEXSwap = async (
  market: TDEXv2Market,
  network: NetworkString,
  newContract: Contract,
  preparedTx: PreparedBorrowTx,
  psetFromBorrow: Pset,
  txid: string,
) => {
  const { collateral, exposure, synthetic } = newContract
  const pair = { from: synthetic, dest: collateral }
  const type = getTradeType(market, pair)
  const vout = preparedTx.pset.outputs.length

  const preview = (
    await fetchTradePreview({
      asset: synthetic,
      feeAsset: collateral,
      market,
      pair,
    })
  )[0]

  const swapRequest = await createTradeProposeRequest({
    amountToBeSent: psetFromBorrow.outputs[vout].value,
    amountToReceive: exposure ? exposure - collateral.quantity : 0,
    assetToBeSent: synthetic.id,
    assetToReceive: collateral.id,
    network,
    outpoint: { txid, vout },
  })

  const tradeProposeRequest: TDEXv2ProposeTradeRequest = {
    feeAmount: preview.feeAmount,
    feeAsset: preview.feeAsset,
    market,
    swapRequest,
    type,
  }

  console.log('outpoint', { txid, vout })
  console.log('preview', preview)
  console.log('tradeProposeRequest', tradeProposeRequest)

  return await fetchTradePropose(tradeProposeRequest)
}
