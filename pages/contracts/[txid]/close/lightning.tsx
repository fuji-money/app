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
import { ConfigContext } from 'components/providers/config'
import { WsElectrumChainSource } from 'lib/chainsource.port'
import { Wallet, WalletType } from 'lib/wallet'

const ContractRedeemLightning: NextPage = () => {
  const { wallets } = useContext(WalletContext)
  const { artifact } = useContext(ConfigContext)
  const { newContract, reloadContracts, resetContracts } =
    useContext(ContractsContext)

  const [data, setData] = useState('')
  const [result, setResult] = useState('')
  const [stage, setStage] = useState(ModalStages.NeedsInvoice)

  const [selected, setSelected] = useState<Wallet>()

  const resetModal = () => {
    resetContracts()
    history.go(-1)
  }

  if (!EnabledTasks[Tasks.Redeem]) return <NotAllowed />
  if (!newContract) return <SomeError>Contract not found</SomeError>

  const quantity = newContract.collateral.quantity

  const proceedWithRedeem = async (wallet: Wallet, swapAddress?: string) => {
    // select coins and prepare redeem transaction
    setStage(ModalStages.NeedsCoins)
    const network = await wallet.getNetwork()

    const owner = wallets.find(
      (w) => w.getMainAccountXPubKey() === newContract.xPubKey,
    )
    if (!owner) throw new Error('Owner not found')

    const tx = await prepareRedeemTx(
      owner,
      wallet,
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
    const chainSource = new WsElectrumChainSource(network)
    const txid = await chainSource.broadcastTransaction(rawHex)
    await chainSource.close().catch(console.error)
    if (!txid) throw new Error('No txid returned')

    markContractRedeemed(newContract)
    setData(txid)
    setResult(Outcome.Success)
    setStage(ModalStages.ShowResult)
    await reloadContracts()
  }

  const handleInvoice = async (
    wallet: Wallet,
    invoice?: string,
  ): Promise<void> => {
    if (!wallet) return
    setSelected(wallet)
    if (!invoice || typeof invoice !== 'string')
      return openModal(ModalIds.Invoice)
    closeModal(ModalIds.Invoice)
    openModal(ModalIds.Redeem)
    try {
      setStage(ModalStages.NeedsAddress)
      const network = await wallet.getNetwork()
      const refundPublicKey = await wallet.getNewPublicKey()
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
      proceedWithRedeem(wallet, address)
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
        handleInvoice={handleInvoice}
        task={Tasks.Redeem}
      />
      <RedeemModal
        wallet={selected?.type || WalletType.Marina}
        contract={newContract}
        data={data}
        result={result}
        reset={resetModal}
        retry={retry(setData, setResult, () => handleInvoice(selected!))}
        stage={stage}
        task={Tasks.Redeem}
      />
      <InvoiceModal
        contract={newContract}
        handler={(invoice) => handleInvoice(selected!, invoice)}
      />
    </>
  )
}

export default ContractRedeemLightning
