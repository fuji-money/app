import type { NextPage } from 'next'
import { useContext, useState } from 'react'
import { ContractsContext } from 'components/providers/contracts'
import SomeError from 'components/layout/error'
import { ModalStages } from 'components/modals/modal'
import { createSubmarineSwap } from 'lib/swaps'
import { openModal, closeModal, extractError } from 'lib/utils'
import { WalletContext } from 'components/providers/wallet'
import { prepareRedeemTx } from 'lib/covenant'
import { markContractRedeemed } from 'lib/contracts'
import InvoiceModal from 'components/modals/invoice'
import RedeemModal from 'components/modals/redeem'
import EnablersLightning from 'components/enablers/lightning'
import { Outcome, Tasks } from 'lib/types'

const ContractTaskLightning: NextPage = () => {
  const { marina, network } = useContext(WalletContext)
  const { newContract, reloadContracts, resetContracts } =
    useContext(ContractsContext)

  const [data, setData] = useState('')
  const [result, setResult] = useState('')
  const [stage, setStage] = useState(ModalStages.NeedsInvoice)

  if (!newContract) return <SomeError>Contract not found</SomeError>

  const quantity = newContract.collateral.quantity || 0
  const payoutAmount = newContract.payoutAmount || 0
  const amount = quantity - payoutAmount

  const proceedWithRedeem = async (swapAddress?: string) => {
    if (!marina) return

    // select coins and prepare redeem transaction
    setStage(ModalStages.NeedsCoins)
    const tx = await prepareRedeemTx(newContract, network, swapAddress)

    // ask user to sign transaction
    setStage(ModalStages.NeedsConfirmation)
    const signed = await tx.unlock()

    // inform user transaction is finishing
    setStage(ModalStages.NeedsFinishing)

    // finalize the fuji asset input
    // we skip utxo in position 0 since is finalized already by the redeem function
    for (let index = 1; index < signed.psbt.data.inputs.length; index++) {
      signed.psbt.finalizeInput(index)
    }

    // extract and broadcast transaction
    const rawHex = signed.psbt.extractTransaction().toHex()
    const txid = (await marina.broadcastTransaction(rawHex)).txid

    markContractRedeemed(newContract)
    setData(txid)
    setResult(Outcome.Success)
    reloadContracts()
  }

  const handleInvoice = async (invoice = ''): Promise<void> => {
    if (!marina) return
    if (!invoice) return openModal('invoice-modal')
    closeModal('invoice-modal')
    openModal('redeem-modal')
    try {
      setStage(ModalStages.NeedsAddress)
      const refundPublicKey = (await marina.getNextAddress()).publicKey!
      // create swap with Boltz.exchange
      const boltzSwap = await createSubmarineSwap(
        invoice,
        network,
        refundPublicKey,
      )
      if (!boltzSwap) throw new Error('Error creating swap')
      const { address, expectedAmount, redeemScript } = boltzSwap
      if (expectedAmount > amount)
        throw new Error('Expected amount higher then collateral amount')
      proceedWithRedeem(address)
    } catch (error) {
      console.debug(extractError(error))
      setData(extractError(error))
      setResult(Outcome.Failure)
    }
  }

  const retry = (handler: () => {}) => {
    return () => {
      setData('')
      setResult('')
      handler()
    }
  }

  return (
    <>
      <EnablersLightning
        contract={newContract}
        handleInvoice={handleInvoice}
        task={Tasks.Redeem}
      />
      <RedeemModal
        contract={newContract}
        data={data}
        result={result}
        reset={resetContracts}
        retry={retry(handleInvoice)}
        stage={stage}
      />
      <InvoiceModal contract={newContract} handler={handleInvoice} />
    </>
  )
}

export default ContractTaskLightning
