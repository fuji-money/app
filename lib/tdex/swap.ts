import axios from 'axios'
import {
  getMainAccountCoins,
  getNextAddress,
  getNextChangeAddress,
} from 'lib/marina'
import { Contract } from 'lib/types'
import {
  AssetHash,
  Creator,
  Pset,
  Transaction,
  Updater,
  address,
} from 'liquidjs-lib'
import { Address, NetworkString } from 'marina-provider'
import { getTradeType } from './market'
import {
  TDEXMarket,
  TDEXProposeTradeRequest,
  TDEXProposeTradeResponse,
  TDEXSwapRequest,
  TDEXUnblindedInput,
} from './types'
import { makeid } from 'lib/utils'
import { PreparedBorrowTx } from 'lib/covenant'
import { fetchTradePreview } from './preview'
import { selectCoins } from 'lib/selection'
import { feeAmount } from 'lib/constants'
import { getLBTC } from 'lib/assets'

interface createTradeProposeRequestProps {
  amountToBeSent: number
  amountToReceive: number
  assetToBeSent: string
  assetToReceive: string
  network: NetworkString
  outpoint: { txid: string; vout: number }
  swapFeeAmount: number
  swapFeeAsset: string
}

const createTradeProposeRequest = async ({
  amountToBeSent,
  amountToReceive,
  assetToBeSent,
  assetToReceive,
  network,
  outpoint,
  swapFeeAmount,
  swapFeeAsset,
}: createTradeProposeRequestProps): Promise<TDEXSwapRequest> => {
  // build Psbt
  const pset = Creator.newPset()
  const updater = new Updater(pset)
  const unblindedInputs: TDEXUnblindedInput[] = []

  // select and validate we have necessary utxos
  const lbtc = getLBTC(network)
  const coins = await getMainAccountCoins()
  const fujiCoin = coins.find(
    (u) => u.txid === outpoint.txid && u.vout === outpoint.vout,
  )
  const feeCoins = selectCoins(coins, lbtc.id, feeAmount)

  if (!fujiCoin) throw new Error('Fuji coin not found')
  if (!feeCoins) throw new Error('Not enough funds for fees')

  const utxos = [fujiCoin, ...feeCoins]

  // transaction inputs
  utxos.forEach((utxo, index) => {
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
        index,
        asset: utxo.blindingData.asset,
        amount: utxo.blindingData.value.toString(),
        assetBlinder: utxo.blindingData.assetBlindingFactor,
        amountBlinder: utxo.blindingData.valueBlindingFactor,
      })
    }
  })

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

  // check if there's change (from fee coins)
  const feeCoinsAmount = feeCoins.reduce(
    (value, utxo) => value + (utxo.blindingData?.value || 0),
    0,
  )

  const changeAmount = feeCoinsAmount - feeAmount

  if (changeAmount > 0) {
    const changeAddress = await getNextChangeAddress()
    const { scriptPubKey, blindingKey } = address.fromConfidential(
      changeAddress.confidentialAddress,
    )
    updater.addOutputs([
      {
        script: scriptPubKey,
        amount: changeAmount,
        asset: lbtc.id,
        blinderIndex: 1,
        blindingPublicKey: blindingKey,
      },
    ])
  }

  const swapRequest: TDEXSwapRequest = {
    id: makeid(8),
    amountP: amountToBeSent,
    assetP: assetToBeSent,
    amountR: amountToReceive,
    assetR: assetToReceive,
    feeAmount: swapFeeAmount,
    feeAsset: swapFeeAsset,
    transaction: pset.toBase64(),
    unblindedInputs,
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
    swapFeeAmount: Number(preview.feeAmount),
    swapFeeAsset: preview.feeAsset,
  })

  return await fetchTradePropose({
    feeAmount: preview.feeAmount,
    feeAsset: preview.feeAsset,
    market,
    swapRequest,
    type,
  })
}
