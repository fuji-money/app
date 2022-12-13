import type { NextPage } from 'next'
import { useContext, useState } from 'react'
import { ContractsContext } from 'components/providers/contracts'
import SomeError from 'components/layout/error'
import { ModalIds, ModalStages } from 'components/modals/modal'
import { WalletContext } from 'components/providers/wallet'
import { marinaMainAccountID, feeAmount } from 'lib/constants'
import {
  saveContractToStorage,
  markContractTopup,
  markContractConfirmed,
} from 'lib/contracts'
import {
  finalizeTopupCovenantInput,
  prepareTopupTx,
  proposeTopupContract,
} from 'lib/covenant'
import { openModal, extractError, retry } from 'lib/utils'
import EnablersLiquid from 'components/enablers/liquid'
import MarinaDepositModal from 'components/modals/marinaDeposit'
import { Outcome } from 'lib/types'
import { address, Psbt, Transaction } from 'liquidjs-lib'
import { EnabledTasks, Tasks } from 'lib/tasks'
import NotAllowed from 'components/messages/notAllowed'
import { selectCoinsWithBlindPrivKey } from 'lib/selection'
import { broadcastTx, waitForContractConfirmation } from 'lib/websocket'

const ContractTopupLiquid: NextPage = () => {
  const { blindPrivKeysMap, marina, network } = useContext(WalletContext)
  const { newContract, oldContract, reloadContracts, resetContracts } =
    useContext(ContractsContext)

  const [data, setData] = useState('')
  const [result, setResult] = useState('')
  const [stage, setStage] = useState(ModalStages.NeedsInvoice)

  const resetModal = () => {
    resetContracts()
    history.go(-1)
  }

  if (!EnabledTasks[Tasks.Topup]) return <NotAllowed />
  if (!newContract) return <SomeError>Contract not found</SomeError>
  if (!oldContract) return <SomeError>Contract not found</SomeError>

  // validate contracts
  if (!oldContract.txid) throw new Error('Old contract without txid')
  if (!newContract.collateral.quantity)
    throw new Error('New contract without collateral quantity')
  if (!oldContract.collateral.quantity)
    throw new Error('Old contract without collateral quantity')

  const topupAmount =
    newContract.collateral.quantity - oldContract.collateral.quantity

  const handleMarina = async (): Promise<void> => {
    if (!marina) return
    openModal(ModalIds.MarinaDeposit)
    setStage(ModalStages.NeedsCoins)
    try {
      // validate we have necessary utxos
      const collateralUtxos = selectCoinsWithBlindPrivKey(
        await marina.getCoins([marinaMainAccountID]),
        newContract.collateral.id,
        topupAmount + feeAmount,
        blindPrivKeysMap,
      )
      if (collateralUtxos.length === 0)
        throw new Error('Not enough collateral funds')

      // prepare topup transaction
      const preparedTx = await prepareTopupTx(
        newContract,
        oldContract,
        network,
        collateralUtxos,
        blindPrivKeysMap,
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
      finalizeTopupCovenantInput(ptx)

      // finalize the other inputs
      for (let index = 1; index < ptx.data.inputs.length; index++) {
        ptx.finalizeInput(index)
      }

      // broadcast transaction
      const rawHex = ptx.extractTransaction().toHex()
      const data = await broadcastTx(rawHex, network)
      if (data.error) throw new Error(data.error)
      newContract.txid = data.result
      if (!newContract.txid) throw new Error('No txid returned')

      // add vout to contract
      const covenantVout = 1
      newContract.vout = covenantVout

      // add covenant address to contract
      newContract.addr = address.fromOutputScript(
        Transaction.fromHex(rawHex)?.outs?.[covenantVout]?.script,
      )

      // wait for confirmation, mark contract confirmed and reload contracts
      waitForContractConfirmation(newContract, network).then(() => {
        markContractConfirmed(newContract)
        reloadContracts()
      })

      // add additional fields to contract and save to storage
      await saveContractToStorage(newContract, network, preparedTx)

      // mark old contract as topup
      markContractTopup(oldContract)

      // show success
      setData(newContract.txid)
      setResult(Outcome.Success)
      setStage(ModalStages.ShowResult)
      reloadContracts()
    } catch (error) {
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
        task={Tasks.Topup}
      />
      <MarinaDepositModal
        contract={newContract}
        data={data}
        result={result}
        reset={resetModal}
        retry={retry(setData, setResult, handleMarina)}
        stage={stage}
        task={Tasks.Topup}
      />
    </>
  )
}

export default ContractTopupLiquid
