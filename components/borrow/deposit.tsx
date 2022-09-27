import { Contract } from 'lib/types'
import Swap from 'components/deposit/swap'
import Marina from 'components/deposit/marina'
import Channel from 'components/deposit/channel'
import { randomBytes } from 'crypto'
import { feeAmount } from 'lib/constants'
import { saveContractToStorage } from 'lib/contracts'
import {
  prepareBorrowTx,
  prepareBorrowTxWithClaimTx,
  proposeBorrowContract,
} from 'lib/covenant'
import { broadcastTx, signAndBroadcastTx } from 'lib/marina'
import { createReverseSubmarineSwap, waitForLightningPayment } from 'lib/swaps'
import { Psbt, witnessStackToScriptWitness } from 'liquidjs-lib'
import ECPairFactory from 'ecpair'
import { extractError, openModal } from 'lib/utils'
import * as ecc from 'tiny-secp256k1'
import { WalletContext } from 'components/providers/wallet'
import { useContext, useState } from 'react'
import MarinaDepositModal from 'components/modals/marinaDeposit'
import LightningDepositModal from 'components/modals/lightningDeposit'
import { ContractsContext } from 'components/providers/contracts'
import { ModalStages } from 'components/modals/modal'

interface BorrowDepositProps {
  contract: Contract
  channel: string
  setChannel: (arg0: string) => void
  setDeposit: (arg0: boolean) => void
}

const BorrowDeposit = ({
  contract,
  channel,
  setChannel,
  setDeposit,
}: BorrowDepositProps) => {
  const { network } = useContext(WalletContext)
  const { reloadContracts } = useContext(ContractsContext)

  const [data, setData] = useState('')
  const [invoice, setInvoice] = useState('')
  const [result, setResult] = useState('')
  const [stage, setStage] = useState(ModalStages.NeedsInvoice)

  const lightning = channel === 'lightning'
  const liquid = channel === 'liquid'

  const resetDeposit = (): void => {
    setChannel('')
    setDeposit(false)
    setData('')
    setResult('')
  }

  const handleLightning = async (): Promise<void> => {
    openModal('lightning-deposit-modal')
    setStage(ModalStages.NeedsInvoice)
    try {
      // create ephemeral account
      const privateKey = randomBytes(32)
      const keyPair = ECPairFactory(ecc).fromPrivateKey(privateKey)

      // give enough satoshis to pay for all fees expected, so that we
      // can use the returning coin as a solo input for the borrow tx
      if (!contract.collateral.quantity) return
      const onchainAmount = contract.collateral.quantity + feeAmount

      // create swap with Boltz.exchange
      const boltzSwap = await createReverseSubmarineSwap(
        keyPair.publicKey,
        network,
        onchainAmount,
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

      // prepare borrow transaction with claim utxo as input
      const preparedTx = await prepareBorrowTxWithClaimTx(
        contract,
        network,
        redeemScript,
        utxos,
      )

      // propose contract to alpha factory
      const { partialTransaction } = await proposeBorrowContract(preparedTx)

      // sign and finalize input[0]
      const psbt = Psbt.fromBase64(partialTransaction)
      psbt.signInput(0, keyPair)
      psbt.finalizeInput(0, (_, input) => {
        return {
          finalScriptSig: undefined,
          finalScriptWitness: witnessStackToScriptWitness([
            input.partialSig![0].signature,
            preimage,
            Buffer.from(redeemScript, 'hex'),
          ]),
        }
      })

      setStage(ModalStages.NeedsFinishing)

      // broadcast transaction
      contract.txid = await broadcastTx(psbt.toBase64())

      // add vout to contract
      contract.vout = 0

      // add additional fields to contract and save to storage
      await saveContractToStorage(contract, network, preparedTx)

      // show success
      setData(contract.txid)
      setResult('success')
      reloadContracts()
    } catch (error) {
      setData(extractError(error))
      setResult('failure')
    }
  }

  const handleMarina = async (): Promise<void> => {
    openModal('marina-deposit-modal')
    setStage(ModalStages.NeedsCoins)
    try {
      // prepare borrow transaction
      const preparedTx = await prepareBorrowTx(contract, network)
      if (!preparedTx) throw new Error('Unable to prepare Tx')

      // propose contract to alpha factory
      setStage(ModalStages.NeedsFujiApproval)
      const { partialTransaction } = await proposeBorrowContract(preparedTx)

      // sign and broadcast transaction
      setStage(ModalStages.NeedsConfirmation)
      contract.txid = await signAndBroadcastTx(partialTransaction)

      setStage(ModalStages.NeedsFinishing)

      // add vout to contract
      contract.vout = 0

      // add additional fields to contract and save to storage
      await saveContractToStorage(contract, network, preparedTx)

      // show success
      setData(contract.txid)
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
        {!channel && <Channel contract={contract} setChannel={setChannel} />}
        {lightning && <Swap contract={contract} handler={handleLightning} />}
        {liquid && <Marina contract={contract} handler={handleMarina} />}
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

export default BorrowDeposit
