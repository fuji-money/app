import axios from 'axios'
import { getMainAccountCoins, getNextAddress } from 'lib/marina'
import { Contract } from 'lib/types'
import { Creator, Pset, Transaction, Updater, address } from 'liquidjs-lib'
import { Address } from 'marina-provider'
import { getTradeType } from './market'
import {
  TDEXMarket,
  AssetPair,
  TDEXProposeTradeRequest,
  TDEXTradeType,
  TDEXProposeTradeResponse,
  TDEXProposeTradeSwapRequest,
} from './types'
import { makeid } from 'lib/utils'
import { PreparedBorrowTx } from 'lib/covenant'
import { fetchTradePreview } from './preview'

interface createTradeProposeRequestProps {
  addressForSwapOutput: Address
  amountToBeSent: number
  amountToReceive: number
  assetToBeSent: string
  assetToReceive: string
  feeAmount: string
  feeAsset: string
  outpoint: { txid: string; vout: number }
}

const createTradeProposeRequest = async ({
  addressForSwapOutput,
  amountToBeSent,
  amountToReceive,
  assetToBeSent,
  assetToReceive,
  feeAmount,
  feeAsset,
  outpoint,
}: createTradeProposeRequestProps): Promise<TDEXProposeTradeSwapRequest> => {
  // build Psbt
  const pset = Creator.newPset()
  const updater = new Updater(pset)

  // select and validate we have necessary utxos
  const utxos = await getMainAccountCoins()
  const utxo = utxos.find(
    (u) => u.txid === outpoint.txid && u.vout === outpoint.vout,
  )
  if (!utxo) throw new Error('Not enough funds')

  // receiving script
  const { scriptPubKey, blindingKey } = address.fromConfidential(
    addressForSwapOutput.confidentialAddress,
  )

  updater
    .addInputs([
      {
        txid: utxo.txid,
        txIndex: utxo.vout,
        witnessUtxo: utxo.witnessUtxo,
        sighashType: Transaction.SIGHASH_ALL,
      },
    ])
    .addOutputs([
      {
        script: scriptPubKey,
        amount: amountToReceive,
        asset: assetToReceive,
        blinderIndex: 0,
        blindingPublicKey: blindingKey,
      },
    ])

  const swapRequest = {
    id: makeid(8),
    amountP: String(amountToBeSent),
    assetP: assetToBeSent,
    amountR: String(amountToReceive),
    assetR: assetToReceive,
    feeAmount,
    feeAsset,
    transaction: pset.toBase64(),
  }

  return swapRequest
}

const fetchTradePropose = async (
  args: TDEXProposeTradeRequest,
): Promise<TDEXProposeTradeResponse> => {
  const url = args.market.provider.endpoint + '/v2/trade/propose'
  const opt = { headers: { 'Content-Type': 'application/json' } }
  return await axios.post(url, args, opt)
}

export const proposeTDEXSwap = async (
  market: TDEXMarket,
  newContract: Contract,
  preparedTx: PreparedBorrowTx,
  pset: Pset,
  txid: string,
) => {
  const { collateral, exposure, synthetic } = newContract
  const pair = { from: synthetic, dest: collateral }
  const type = getTradeType(market, pair)
  const vout = preparedTx.pset.outputs.length

  const preview = await fetchTradePreview({
    asset: synthetic,
    feeAsset: collateral,
    market,
    pair,
  })

  const { feeAmount, feeAsset } = preview[0]

  const swapRequest = await createTradeProposeRequest({
    addressForSwapOutput: await getNextAddress(),
    amountToBeSent: pset.outputs[vout].value,
    amountToReceive: exposure ? exposure - collateral.quantity : 0,
    assetToBeSent: synthetic.id,
    assetToReceive: collateral.id,
    feeAmount,
    feeAsset,
    outpoint: { txid, vout },
  })

  return await fetchTradePropose({
    feeAmount,
    feeAsset,
    market,
    swapRequest,
    type,
  })
}
