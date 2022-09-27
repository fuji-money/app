import { Contract } from 'lib/types'
import Swap from 'components/deposit/swap'
import Marina from 'components/deposit/marina'
import Channel from 'components/deposit/channel'
import LightningDepositModal from 'components/modals/lightningDeposit'
import MarinaDepositModal from 'components/modals/marinaDeposit'
import { ContractsContext } from 'components/providers/contracts'
import { WalletContext } from 'components/providers/wallet'
import { useContext, useState } from 'react'
import { markContractTopup, saveContractToStorage } from 'lib/contracts'
import { prepareTopupTx, proposeTopupContract } from 'lib/covenant'
import { openModal, extractError } from 'lib/utils'
import { Psbt, Transaction, witnessStackToScriptWitness } from 'liquidjs-lib'
import { randomBytes } from 'crypto'
import ECPairFactory from 'ecpair'
import { feeAmount, marinaMainAccountID } from 'lib/constants'
import { broadcastTx, selectCoinsWithBlindPrivKey } from 'lib/marina'
import { createReverseSubmarineSwap, waitForLightningPayment } from 'lib/swaps'
import * as ecc from 'tiny-secp256k1'
import { fetchHex } from 'lib/fetch'
import { ModalStages } from 'components/modals/modal'

interface TopupDepositProps {
  channel: string
  newContract: Contract
  oldContract: Contract
  setChannel: (arg0: string) => void
  setDeposit: (arg0: boolean) => void
}

const TopupDeposit = ({
  channel,
  newContract,
  oldContract,
  setChannel,
  setDeposit,
}: TopupDepositProps) => {
  const { marina, network } = useContext(WalletContext)
  const { reloadContracts } = useContext(ContractsContext)

  const [data, setData] = useState('')
  const [invoice, setInvoice] = useState('')
  const [result, setResult] = useState('')
  const [stage, setStage] = useState(ModalStages.NeedsInvoice)

  const lightning = channel === 'lightning'
  const liquid = channel === 'liquid'

  // validate contracts
  if (!oldContract.txid) throw new Error('Old contract without txid')
  if (!newContract.collateral.quantity)
    throw new Error('New contract without collateral quantity')
  if (!oldContract.collateral.quantity)
    throw new Error('Old contract without collateral quantity')

  const topupAmount =
    newContract.collateral.quantity - oldContract.collateral.quantity

  const resetDeposit = () => {
    setChannel('')
    setDeposit(false)
  }

  const finalizeCovenantInput = (ptx: Psbt) => {
    const covenantInputIndex = 0
    const { tapScriptSig } = ptx.data.inputs[covenantInputIndex]
    let witnessStack: Buffer[] = []
    if (tapScriptSig && tapScriptSig.length > 0) {
      for (const s of tapScriptSig) {
        witnessStack.push(s.signature)
      }
    }
    ptx.finalizeInput(covenantInputIndex, (_, input) => {
      return {
        finalScriptSig: undefined,
        finalScriptWitness: witnessStackToScriptWitness([
          ...witnessStack,
          input.tapLeafScript![0].script,
          input.tapLeafScript![0].controlBlock,
        ]),
      }
    })
  }

  const handleLightning = async (): Promise<void> => {
    if (!marina) return
    openModal('lightning-deposit-modal')
    setStage(ModalStages.NeedsInvoice)
    try {
      // create ephemeral account
      const privateKey = randomBytes(32)
      const keyPair = ECPairFactory(ecc).fromPrivateKey(privateKey)

      // give enough satoshis to pay for all fees expected, so that we
      // can use the returning coin as a solo input for the topup tx
      const onchainTopupAmount = topupAmount + feeAmount

      // create swap with boltz.exchange
      const boltzSwap = await createReverseSubmarineSwap(
        keyPair.publicKey,
        network,
        onchainTopupAmount,
      )
      if (!boltzSwap) throw new Error('Error creating swap')

      // deconstruct swap
      const { invoice, lockupAddress, preimage, redeemScript } = boltzSwap

      // show qr code to user
      setInvoice(invoice)
      setStage(ModalStages.NeedsPayment)

      // wait for payment
      const utxos = await waitForLightningPayment(
        invoice,
        lockupAddress,
        network,
      )

      // payment was never made, and the invoice expired
      if (utxos.length === 0) throw new Error('Invoice has expired')

      // show user (via modal) that payment was received
      setInvoice('')
      setStage(ModalStages.NeedsFujiApproval)

      // get prevout for utxo
      const [utxo] = utxos
      const hex = await fetchHex(utxo.txid, network)
      const prevout = Transaction.fromHex(hex).outs[utxo.vout]
      const value = onchainTopupAmount
      const collateralUtxos = [{ ...utxo, prevout, value, redeemScript }]

      // prepare borrow transaction with claim utxo as input
      const preparedTx = await prepareTopupTx(
        newContract,
        oldContract,
        network,
        collateralUtxos,
      )

      // propose contract to alpha factory
      const { partialTransaction } = await proposeTopupContract(preparedTx)
      if (!partialTransaction) throw new Error('Not accepted by Fuji')

      // sign collateral input with ephemeral key pair
      const aux = Psbt.fromBase64(partialTransaction)
      aux.signInput(1, keyPair)

      // ask user to sign tx with marina
      setStage(ModalStages.NeedsConfirmation)
      const base64 = await marina.signTransaction(aux.toBase64())
      const ptx = Psbt.fromBase64(base64)

      // tell user we are now on the final stage of the process
      setStage(ModalStages.NeedsFinishing)

      // finalize covenant input
      finalizeCovenantInput(ptx)

      // finalize input[1] - collateral via claim transaction
      ptx.finalizeInput(1, (_, input) => {
        return {
          finalScriptSig: undefined,
          finalScriptWitness: witnessStackToScriptWitness([
            input.partialSig![0].signature,
            preimage,
            Buffer.from(redeemScript, 'hex'),
          ]),
        }
      })

      // broadcast transaction
      newContract.txid = await broadcastTx(ptx.toBase64())
      newContract.vout = 1

      // add additional fields to contract and save to storage
      await saveContractToStorage(newContract, network, preparedTx)

      // mark old contract as topup
      markContractTopup(oldContract)

      // show success
      setData(newContract.txid)
      setResult('success')
      reloadContracts()
    } catch (error) {
      setData(extractError(error))
      setResult('failure')
    }
  }

  const handleMarina = async () => {
    if (!marina) return
    openModal('marina-deposit-modal')
    setStage(ModalStages.NeedsCoins)
    try {
      // validate we have necessary utxos
      const collateralUtxos = selectCoinsWithBlindPrivKey(
        await marina.getCoins([marinaMainAccountID]),
        await marina.getAddresses([marinaMainAccountID]),
        newContract.collateral.id,
        topupAmount + feeAmount,
      )
      if (collateralUtxos.length === 0)
        throw new Error('Not enough collateral funds')

      // prepare topup transaction
      const preparedTx = await prepareTopupTx(
        newContract,
        oldContract,
        network,
        collateralUtxos,
      )
      if (!preparedTx) throw new Error('Unable to prepare Tx')

      // inform user we are proposing contract to fuji and waiting approval
      setStage(ModalStages.NeedsFujiApproval)

      // propose contract to alpha factory
      const { partialTransaction } = await proposeTopupContract(preparedTx)
      if (!partialTransaction) throw new Error('Not accepted by Fuji')

      // user now must sign transaction on marina
      setStage(ModalStages.NeedsConfirmation)
      const base64 = await marina.signTransaction(partialTransaction)
      const ptx = Psbt.fromBase64(base64)

      // tell user we are now on the final stage of the process
      setStage(ModalStages.NeedsFinishing)

      // finalize covenant input
      finalizeCovenantInput(ptx)

      // finalize the other inputs
      for (let index = 1; index < ptx.data.inputs.length; index++) {
        ptx.finalizeInput(index)
      }

      // broadcast transaction
      const rawHex = ptx.extractTransaction().toHex()
      newContract.txid = (await marina.broadcastTransaction(rawHex)).txid
      newContract.vout = 1

      // add additional fields to contract and save to storage
      await saveContractToStorage(newContract, network, preparedTx)

      // mark old contract as topup
      markContractTopup(oldContract)

      // show success
      setData(newContract.txid)
      setResult('success')
      reloadContracts()
    } catch (error) {
      setData(extractError(error))
      setResult('failure')
    }
  }

  return (
    <>
      <div className="is-box has-pink-border p-6">
        {!channel && (
          <Channel
            contract={newContract}
            setChannel={setChannel}
            amount={topupAmount}
          />
        )}
        {lightning && <Swap contract={newContract} handler={handleLightning} />}
        {liquid && <Marina contract={newContract} handler={handleMarina} />}
      </div>
      <MarinaDepositModal
        data={data}
        result={result}
        reset={resetDeposit}
        stage={stage}
      />
      <LightningDepositModal
        data={data}
        invoice={invoice}
        result={result}
        reset={resetDeposit}
        stage={stage}
      />
    </>
  )
}

export default TopupDeposit
