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
import { broadcastTx } from 'lib/websocket'

const ContractRedeemLiquid: NextPage = () => {
  const { blindPrivKeysMap, marina, network } = useContext(WalletContext)
  const { newContract, reloadContracts, resetContracts } =
    useContext(ContractsContext)

  const [data, setData] = useState('')
  const [result, setResult] = useState('')
  const [stage, setStage] = useState(ModalStages.NeedsInvoice)

  if (!EnabledTasks[Tasks.Redeem]) return <NotAllowed />
  if (!newContract) return <SomeError>Contract not found</SomeError>

  const handleMarina = async (): Promise<void> => {
    if (!marina) return
    openModal(ModalIds.Redeem)
    try {
      // select coins and prepare redeem transaction
      setStage(ModalStages.NeedsCoins)
      const tx = await prepareRedeemTx(newContract, network, blindPrivKeysMap)

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
      const data = await broadcastTx(rawHex, network)
      if (data.error) throw new Error(data.error)
      const txid = data.result
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
        handleMarina={handleMarina}
        task={Tasks.Redeem}
      />
      <RedeemModal
        contract={newContract}
        data={data}
        result={result}
        reset={resetContracts}
        retry={retry(setData, setResult, handleMarina)}
        stage={stage}
        task={Tasks.Redeem}
      />
    </>
  )
}

export default ContractRedeemLiquid
