import type { NextPage } from 'next'
import { useContext, useState } from 'react'
import { ContractsContext } from 'components/providers/contracts'
import SomeError from 'components/layout/error'
import { ModalIds, ModalStages } from 'components/modals/modal'
import { markContractRedeemed } from 'lib/contracts'
import { prepareRedeemTx } from 'lib/covenant'
import { openModal, extractError, retry } from 'lib/utils'
import { WalletContext } from 'components/providers/wallet'
import RedeemModal from 'components/modals/redeem'
import EnablersLiquid from 'components/enablers/liquid'
import { Outcome } from 'lib/types'
import { EnabledTasks, Tasks } from 'lib/tasks'
import NotAllowed from 'components/messages/notAllowed'
import { Extractor, Finalizer } from 'liquidjs-lib'
import { ConfigContext } from 'components/providers/config'
import { WsElectrumChainSource } from 'lib/chainsource.port'

const ContractRedeemLiquid: NextPage = () => {
  const { wallet } = useContext(WalletContext)
  const { artifact } = useContext(ConfigContext)
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

  async function handleWallet(): Promise<void> {
    if (!wallet) return
    openModal(ModalIds.Redeem)
    try {
      // select coins and prepare redeem transaction
      setStage(ModalStages.NeedsCoins)
      if (!newContract) throw new Error('Contract not found')
      const network = await wallet.getNetwork()
      const tx = await prepareRedeemTx(wallet, artifact, newContract, network)

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

      // mark on storage and finalize
      markContractRedeemed(newContract)
      setData(txid)
      setResult(Outcome.Success)
      setStage(ModalStages.ShowResult)
      reloadContracts()
    } catch (error) {
      console.debug(extractError(error))
      setData(extractError(error))
      setResult(Outcome.Failure)
      setStage(ModalStages.ShowResult)
    }
  }

  return (
    <>
      <EnablersLiquid
        contract={newContract}
        handleMarina={handleWallet}
        task={Tasks.Redeem}
      />
      <RedeemModal
        contract={newContract}
        data={data}
        result={result}
        reset={resetModal}
        retry={retry(setData, setResult, handleWallet)}
        stage={stage}
        task={Tasks.Redeem}
      />
    </>
  )
}

export default ContractRedeemLiquid
