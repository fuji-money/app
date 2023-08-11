import type { NextPage } from 'next'
import { useContext, useState } from 'react'
import { ContractsContext } from 'components/providers/contracts'
import SomeError from 'components/layout/error'
import { ModalIds, ModalStages } from 'components/modals/modal'
import { WalletContext } from 'components/providers/wallet'
import { feeAmount } from 'lib/constants'
import {
  saveContractToStorage,
  markContractTopup,
  markContractConfirmed,
  getContractCovenantAddress,
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
import { EnabledTasks, Tasks } from 'lib/tasks'
import NotAllowed from 'components/messages/notAllowed'
import { selectCoins } from 'lib/selection'
import { Pset } from 'liquidjs-lib'
import { finalizeTx } from 'lib/transaction'
import { ConfigContext } from 'components/providers/config'
import { WsElectrumChainSource } from 'lib/chainsource.port'
import { Wallet } from 'lib/wallet'

const ContractTopupLiquid: NextPage = () => {
  const [selectedWallet, setSelectedWallet] = useState<Wallet>()
  const { artifact, config } = useContext(ConfigContext)
  const { newContract, oldContract, reloadContracts, resetContracts } =
    useContext(ContractsContext)
  const { wallets } = useContext(WalletContext)

  const [data, setData] = useState('')
  const [result, setResult] = useState('')
  const [stage, setStage] = useState(ModalStages.NeedsInvoice)

  const { oracles } = config

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

  const handleWallet = async (selected: Wallet): Promise<void> => {
    setSelectedWallet(selected)
    openModal(ModalIds.MarinaDeposit)
    setStage(ModalStages.NeedsCoins)
    try {
      const utxos = await selected.getCoins()
      // validate we have necessary utxos
      const { selection: collateralUtxos } = selectCoins(
        utxos,
        newContract.collateral.id,
        topupAmount + feeAmount,
      )
      if (collateralUtxos.length === 0)
        throw new Error('Not enough collateral funds')

      const network = await selected.getNetwork()

      const owner = wallets.find(
        (w) => w.getMainAccountXPubKey() === newContract.xPubKey,
      )
      if (!owner) throw new Error('Owner not found')

      // prepare topup transaction
      const preparedTx = await prepareTopupTx(
        owner,
        selected,
        artifact,
        newContract,
        oldContract,
        network,
        collateralUtxos,
        oracles[0],
        config.xOnlyTreasuryPublicKey,
      )
      if (!preparedTx) throw new Error('Unable to prepare Tx')

      // inform user we are proposing contract to fuji and waiting approval
      setStage(ModalStages.NeedsFujiApproval)

      // propose contract to alpha factory
      const { partialTransaction } = await proposeTopupContract(
        preparedTx,
        network,
      )
      if (!partialTransaction) throw new Error('Not accepted by Fuji')

      // user now must sign transaction on marina
      setStage(ModalStages.NeedsConfirmation)
      const base64 = await selected.signPset(partialTransaction)
      const ptx = Pset.fromBase64(base64)

      // tell user we are now on the final stage of the process
      setStage(ModalStages.NeedsFinishing)

      // finalize covenant input
      finalizeTopupCovenantInput(ptx)

      // finalize the other inputs
      const rawHex = finalizeTx(ptx)

      // broadcast transaction
      const chainSource = new WsElectrumChainSource(network)
      const txid = await chainSource.broadcastTransaction(rawHex)
      await chainSource.close().catch(() => null)
      newContract.txid = txid
      if (!newContract.txid) throw new Error('No txid returned')

      // add vout to contract
      const covenantVout = 1
      newContract.vout = covenantVout

      // add contractParams to contract
      const { contractParams } = preparedTx
      newContract.contractParams = { ...contractParams }

      // add additional fields to contract and save to storage
      // note: save before mark as confirmed (next code block)
      await saveContractToStorage(newContract)

      // wait for confirmation, mark contract confirmed and reload contracts
      chainSource
        .waitForConfirmation(
          newContract.txid,
          await getContractCovenantAddress(artifact, newContract, network),
        )
        .then(() => {
          markContractConfirmed(newContract)
          reloadContracts()
        })

      // mark old contract as topup
      markContractTopup(oldContract)

      // show success
      setData(newContract.txid)
      setResult(Outcome.Success)
      setStage(ModalStages.ShowResult)
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
        handler={handleWallet}
        task={Tasks.Topup}
      />
      <MarinaDepositModal
        contract={newContract}
        data={data}
        result={result}
        reset={resetModal}
        retry={retry(setData, setResult, () => handleWallet(selectedWallet!))}
        stage={stage}
        task={Tasks.Topup}
      />
    </>
  )
}

export default ContractTopupLiquid
