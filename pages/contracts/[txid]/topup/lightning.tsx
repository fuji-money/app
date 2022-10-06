import type { NextPage } from 'next'
import { useContext, useState } from 'react'
import { ContractsContext } from 'components/providers/contracts'
import EnablersLightning from 'components/enablers/lightning'
import { EnabledTasks, Tasks } from 'lib/tasks'
import InvoiceDepositModal from 'components/modals/invoiceDeposit'
import { WalletContext } from 'components/providers/wallet'
import { ModalStages } from 'components/modals/modal'
import SomeError from 'components/layout/error'
import { extractError, openModal, retry } from 'lib/utils'
import ECPairFactory from 'ecpair'
import * as ecc from 'tiny-secp256k1'
import { randomBytes } from 'crypto'
import { createReverseSubmarineSwap, waitForLightningPayment } from 'lib/swaps'
import { fetchHex } from 'lib/fetch'
import { Transaction, witnessStackToScriptWitness } from 'liquidjs-lib'
import {
  finalizeTopupCovenantInput,
  prepareTopupTx,
  proposeTopupContract,
} from 'lib/covenant'
import { broadcastTx } from 'lib/marina'
import { markContractTopup, saveContractToStorage } from 'lib/contracts'
import { feeAmount } from 'lib/constants'
import { Psbt } from 'ldk'
import NotAllowed from 'components/messages/notAllowed'

const ContractTopupLightning: NextPage = () => {
  const { marina, network } = useContext(WalletContext)
  const { newContract, oldContract, reloadContracts, resetContracts } =
    useContext(ContractsContext)

  const [data, setData] = useState('')
  const [invoice, setInvoice] = useState('')
  const [result, setResult] = useState('')
  const [stage, setStage] = useState(ModalStages.NeedsCoins)

  if (!EnabledTasks[Tasks.Topup]) return <NotAllowed />
  if (!newContract) return <SomeError>Contract not found</SomeError>
  if (!oldContract) return <SomeError>Contract not found</SomeError>

  const topupAmount =
    newContract.collateral.quantity - oldContract.collateral.quantity

  if (!newContract) throw new Error('Missing contract')

  const handleInvoice = async (): Promise<void> => {
    if (!marina) return
    openModal('invoice-deposit-modal')
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
      finalizeTopupCovenantInput(ptx)

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

  return (
    <>
      <EnablersLightning
        contract={newContract}
        handleInvoice={handleInvoice}
        task={Tasks.Topup}
      />
      <InvoiceDepositModal
        contract={newContract}
        data={data}
        invoice={invoice}
        result={result}
        retry={retry(setData, setResult, handleInvoice)}
        reset={resetContracts}
        stage={stage}
        task={Tasks.Topup}
      />
    </>
  )
}

export default ContractTopupLightning
