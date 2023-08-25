import type { NextPage } from 'next'
import { useContext, useState } from 'react'
import { ContractsContext } from 'components/providers/contracts'
import SomeError from 'components/layout/error'
import { ModalIds, ModalStages } from 'components/modals/modal'
import { createSubmarineSwap } from 'lib/swaps'
import { openModal, closeModal, extractError, retry } from 'lib/utils'
import { WalletContext } from 'components/providers/wallet'
import { prepareRedeemTx } from 'lib/covenant'
import { markContractRedeemed } from 'lib/contracts'
import InvoiceModal from 'components/modals/invoice'
import RedeemModal from 'components/modals/redeem'
import EnablersLightning from 'components/enablers/lightning'
import { Outcome } from 'lib/types'
import { EnabledTasks, Tasks } from 'lib/tasks'
import NotAllowed from 'components/messages/notAllowed'
import { Extractor, Finalizer } from 'liquidjs-lib'
import { broadcastTx, getNextAddress, getPublicKey } from 'lib/marina'
import { ConfigContext } from 'components/providers/config'

const ContractRedeemLightning: NextPage = () => {
  const { marina, network, updateBalances } = useContext(WalletContext)
  const { artifactRepo } = useContext(ConfigContext)
  const { newContract, reloadContracts, resetContracts } =
    useContext(ContractsContext)

  const [data, setData] = useState('')
  const [result, setResult] = useState('')
  const [stage, setStage] = useState(ModalStages.NeedsInvoice)

  const resetModal = () => {
    resetContracts()
    history.go(-1)
  }

  if (!EnabledTasks[Tasks.Redeem]) return <NotAllowed />
  if (!newContract) return <SomeError>Contract not found</SomeError>

  const quantity = newContract.collateral.quantity

  const proceedWithRedeem = async (swapAddress?: string) => {
    if (!marina || !network) return

    // select coins and prepare redeem transaction
    setStage(ModalStages.NeedsCoins)
    if (newContract.createdAt)
      console.warn(
        'unable to get createdAt timestamp for your contract, getting latest covenant artifact.',
      )

    const artifact = newContract.createdAt
      ? await artifactRepo.get(newContract.createdAt)
      : await artifactRepo.getLatest()

    const tx = await prepareRedeemTx(
      artifact,
      newContract,
      network,
      swapAddress,
    )

    // ask user to sign transaction
    setStage(ModalStages.NeedsConfirmation)
    const signed = await tx.unlock()

    // inform user transaction is finishing
    setStage(ModalStages.NeedsFinishing)

    // finalize the fuji asset input
    // we skip utxo in position 0 since is finalized already by the redeem function
    const finalizer = new Finalizer(signed.pset)
    for (let index = 1; index < signed.pset.globals.inputCount; index++) {
      finalizer.finalizeInput(index)
    }

    // extract and broadcast transaction
    const rawHex = Extractor.extract(finalizer.pset).toHex()
    const { txid } = await broadcastTx(rawHex)
    if (!txid) throw new Error('No txid returned')

    markContractRedeemed(newContract)
    setData(txid)
    setResult(Outcome.Success)
    setStage(ModalStages.ShowResult)
    reloadContracts()
  }

  const handleInvoice = async (invoice?: string): Promise<void> => {
    if (!marina || !network) return
    if (!invoice || typeof invoice !== 'string')
      return openModal(ModalIds.Invoice)
    closeModal(ModalIds.Invoice)
    openModal(ModalIds.Redeem)
    try {
      setStage(ModalStages.NeedsAddress)
      const refundPublicKey = (
        await getPublicKey(await getNextAddress())
      ).toString('hex')
      // create swap with Boltz.exchange
      const boltzSwap = await createSubmarineSwap(
        invoice,
        network,
        refundPublicKey,
      )
      if (!boltzSwap) throw new Error('Error creating swap')
      const { address, expectedAmount } = boltzSwap
      if (expectedAmount > quantity)
        throw new Error('Expected amount higher then collateral amount')
      proceedWithRedeem(address)
    } catch (error) {
      console.debug(extractError(error))
      setData(extractError(error))
      setResult(Outcome.Failure)
      setStage(ModalStages.ShowResult)
    }
  }

  return (
    <>
      <EnablersLightning
        contract={newContract}
        handleAlby={handleInvoice}
        handleInvoice={handleInvoice}
        task={Tasks.Redeem}
      />
      <RedeemModal
        contract={newContract}
        data={data}
        result={result}
        reset={resetModal}
        retry={retry(setData, setResult, handleInvoice, updateBalances)}
        stage={stage}
        task={Tasks.Redeem}
      />
      <InvoiceModal contract={newContract} handler={handleInvoice} />
    </>
  )
}

export default ContractRedeemLightning
