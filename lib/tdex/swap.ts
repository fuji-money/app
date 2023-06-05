import { getMainAccountCoins, getNextChangeAddress } from 'lib/marina'
import { selectCoins } from 'lib/selection'
import { Asset } from 'lib/types'
import {
  AssetHash,
  Creator,
  Transaction,
  Updater,
  address,
  networks,
} from 'liquidjs-lib'
import { NetworkString } from 'marina-provider'
import { TDEXMarket, AssetPair, TDEXTradeType } from './types'
import { fetchTradePreview } from './preview'
import { getTradeType } from './market'

const getAssetsAndAmounts = async (
  asset: Asset,
  market: TDEXMarket,
  pair: AssetPair,
) => {
  // get trade type
  const buy = TDEXTradeType.BUY
  const tradeType = getTradeType(market, pair)

  // make a preview
  const preview = await fetchTradePreview(asset, market, pair)

  return {
    assetToBeSent: tradeType === buy ? market.quoteAsset : market.baseAsset,
    assetToReceive: tradeType === buy ? market.baseAsset : market.quoteAsset,
    amountToBeSent: asset.quantity,
    amountToReceive: Number(preview[0].amount),
  }
}

export const createSwapTransaction = async (
  asset: Asset,
  market: TDEXMarket,
  pair: AssetPair,
  network: NetworkString,
  addressForSwapOutput: string,
) => {
  const inputBlindingKeys: Record<any, any> = {}
  const outputBlindingKeys: Record<any, any> = {}
  const changeAmount = 0

  const { assetToBeSent, assetToReceive, amountToBeSent, amountToReceive } =
    await getAssetsAndAmounts(asset, market, pair)

  // build Psbt
  const pset = Creator.newPset()
  const updater = new Updater(pset)

  // select and validate we have necessary utxos
  const utxos = await getMainAccountCoins()
  const selectedUtxos = selectCoins(utxos, assetToBeSent, amountToBeSent)
  if (selectedUtxos.length === 0) throw new Error('Not enough funds')

  // receiving script
  const receivingScript = address
    .toOutputScript(addressForSwapOutput, networks[network])
    .toString('hex')

  updater
    .addInputs(
      selectedUtxos.map((utxo) => ({
        txid: utxo.txid,
        txIndex: utxo.vout,
        witnessUtxo: utxo.witnessUtxo,
        sighashType: Transaction.SIGHASH_ALL,
      })),
    )
    .addOutputs([
      {
        script: Buffer.from(receivingScript, 'hex'),
        amount: amountToReceive,
        asset: AssetHash.fromHex(assetToReceive).bytes.toString('hex'),
      },
    ])

  // we update the outputBlindingKeys map after we add the receiving output to the transaction
  const blindKey = '00' // TODO await this.identity.getBlindingPrivateKey(receivingScript)
  outputBlindingKeys[receivingScript] = Buffer.from(blindKey, 'hex')

  if (changeAmount > 0) {
    const changeAddress = await getNextChangeAddress()
    const { scriptPubKey, blindingKey } = address.fromConfidential(
      changeAddress.confidentialAddress,
    )
    updater.addOutputs([
      {
        script: scriptPubKey,
        amount: changeAmount,
        asset: assetToBeSent,
        blinderIndex: 0,
        blindingPublicKey: blindingKey,
      },
    ])
  }

  return { inputBlindingKeys, outputBlindingKeys, pset }
}
