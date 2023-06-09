import axios from 'axios'
import { getMainAccountCoins, getNextAddress } from 'lib/marina'
import { Contract } from 'lib/types'
import { Creator, Pset, Transaction, Updater, address } from 'liquidjs-lib'
import { getTradeType } from './market'
import {
  TDEXv2CompleteTradeRequest,
  TDEXv2CompleteTradeResponse,
  TDEXv2Market,
  TDEXv2PreviewTradeResponse,
  TDEXv2ProposeTradeRequest,
  TDEXv2ProposeTradeResponse,
  TDEXv2SwapRequest,
  TDEXv2UnblindedInput,
} from './types'
import { makeid } from 'lib/utils'
import { PreparedBorrowTx } from 'lib/covenant'
import { fetchTradePreview } from './preview'

interface createTradeProposeRequestProps {
  contract: Contract
  outpoint: { txid: string; vout: number }
  preview: TDEXv2PreviewTradeResponse
}

const createTradeProposeRequest = async ({
  contract,
  outpoint,
  preview,
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
      amount: Number(preview.amount) - Number(preview.feeAmount),
      asset: preview.asset,
      blinderIndex: 0,
      blindingPublicKey: blindingKey,
    },
  ])

  console.log('pset aka transaction in swap request', pset)

  const { synthetic } = contract

  const swapRequest: TDEXv2SwapRequest = {
    id: makeid(8),
    amountP: synthetic.quantity.toString(),
    assetP: synthetic.id,
    amountR: preview.amount.toString(),
    assetR: preview.asset,
    transaction: pset.toBase64(),
    unblindedInputs,
  }

  return swapRequest
}

export const proposeTDEXSwap = async (
  market: TDEXv2Market,
  newContract: Contract,
  outpoint: { txid: string; vout: number },
) => {
  const { collateral, synthetic } = newContract
  const pair = { from: synthetic, dest: collateral }
  const type = getTradeType(market, pair)

  const preview = (
    await fetchTradePreview({
      asset: synthetic,
      feeAsset: collateral,
      market,
      type,
    })
  )[0]

  const swapRequest = await createTradeProposeRequest({
    contract: newContract,
    outpoint,
    preview,
  })

  const tradeProposeRequest: TDEXv2ProposeTradeRequest = {
    feeAmount: preview.feeAmount,
    feeAsset: preview.feeAsset,
    market: { baseAsset: market.baseAsset, quoteAsset: market.quoteAsset },
    swapRequest,
    type,
  }

  console.log('outpoint', outpoint)
  console.log('preview', preview)
  console.log('tradeProposeRequest', tradeProposeRequest)

  const url = market.provider.endpoint + '/v2/trade/propose'
  const opt = { headers: { 'Content-Type': 'application/json' } }
  const res = await axios.post(url, tradeProposeRequest, opt)
  return res.data
}

export const completeTDEXSwap = async (
  acceptId: string,
  market: TDEXv2Market,
  transaction: string,
): Promise<TDEXv2CompleteTradeResponse> => {
  const completeTradeRequest: TDEXv2CompleteTradeRequest = {
    id: makeid(8),
    acceptId,
    transaction,
  }
  const url = market.provider.endpoint + '/v2/trade/complete'
  const opt = { headers: { 'Content-Type': 'application/json' } }
  const res = await axios.post(url, completeTradeRequest, opt)
  return res.data
}
