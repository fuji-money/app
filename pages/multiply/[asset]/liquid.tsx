import type { NextPage } from 'next'
import { useContext, useEffect, useState } from 'react'
import SomeError from 'components/layout/error'
import { EnabledTasks, Tasks } from 'lib/tasks'
import { ContractsContext } from 'components/providers/contracts'
import NotAllowed from 'components/messages/notAllowed'
import EnablersLiquid from 'components/enablers/liquid'
import { ModalIds, ModalStages } from 'components/modals/modal'
import {
  PreparedBorrowTx,
  prepareBorrowTx,
  proposeBorrowContract,
} from 'lib/covenant'
import { broadcastTx, getNextAddress, signTx } from 'lib/marina'
import { Contract, Outcome } from 'lib/types'
import { openModal, extractError } from 'lib/utils'
import { Pset } from 'liquidjs-lib'
import { ConfigContext } from 'components/providers/config'
import { WalletContext } from 'components/providers/wallet'
import {
  saveContractToStorage,
  getContractCovenantAddress,
  markContractConfirmed,
} from 'lib/contracts'
import { finalizeTx } from 'lib/transaction'
import MarinaMultiplyModal from 'components/modals/marinaMultiply'
import { findBestMarket } from 'lib/tdex/market'
import { TDEXMarket, AssetPair } from 'lib/tdex/types'
import { proposeTDEXSwap } from 'lib/tdex/swap'

const MultiplyLiquid: NextPage = () => {
  const { chainSource, network, xPubKey } = useContext(WalletContext)
  const { artifact, config } = useContext(ConfigContext)
  const { newContract, reloadContracts } = useContext(ContractsContext)

  const [data, setData] = useState('')
  const [result, setResult] = useState('')
  const [stage, setStage] = useState(ModalStages.NeedsInvoice)

  const { oracles } = config

  const [market, setMarket] = useState<TDEXMarket>()

  // fetch and set markets (needs to fetch providers)
  useEffect(() => {
    if (network && newContract) {
      const assetPair: AssetPair = {
        from: newContract.synthetic,
        dest: newContract.collateral,
      }
      findBestMarket(network, assetPair)
        .then((market) => setMarket(market))
        .catch((err) => console.error(err))
    }
  }, [network, newContract])

  // finalize and broadcast proposed transaction
  const finalizeAndBroadcast = async (
    pset: Pset,
    newContract: Contract,
    preparedTx: PreparedBorrowTx,
  ): Promise<string | undefined> => {
    if (!network) return

    // change message to user
    setStage(ModalStages.NeedsFinishing)

    // broadcast transaction
    const rawHex = finalizeTx(pset)
    console.log('rawHex', rawHex)
    const { txid } = await broadcastTx(rawHex)
    if (!txid) throw new Error('No txid returned')
    newContract.txid = txid

    // save contract
    const { contractParams } = preparedTx
    newContract.vout = 0
    newContract.contractParams = { ...contractParams }
    newContract.xPubKey = xPubKey
    await saveContractToStorage({ ...newContract })

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

    return txid
  }

  const handleMarina = async (): Promise<void> => {
    // nothing to do if no new contract
    if (!newContract || !network || !market) return

    try {
      openModal(ModalIds.MarinaMultiply)
      setStage(ModalStages.NeedsCoins)

      // prepare borrow transaction
      const preparedTx = await prepareBorrowTx(
        artifact,
        newContract,
        oracles[0],
      )
      if (!preparedTx) throw new Error('Unable to prepare Tx')

      // propose contract to alpha factory
      setStage(ModalStages.NeedsFujiApproval)
      const { partialTransaction } = await proposeBorrowContract(
        preparedTx,
        network,
      )

      // sign and broadcast transaction
      setStage(ModalStages.NeedsConfirmation)
      const signedTransaction = await signTx(partialTransaction)

      // finalize and broadcast borrow transaction
      const pset = Pset.fromBase64(signedTransaction)
      const txid = await finalizeAndBroadcast(pset, newContract, preparedTx)
      if (!txid) throw new Error("Broadcast didn't returned a txid")

      setStage(ModalStages.NeedsTDEXSwap)

      console.log(
        'gfgfgf',
        await proposeTDEXSwap(market, newContract, preparedTx, pset, txid),
      )

      // setData(txid)
      // setResult(Outcome.Success)
      // setStage(ModalStages.ShowResult)
    } catch (error) {
      setData(extractError(error))
      setResult(Outcome.Failure)
      setStage(ModalStages.ShowResult)
    }
  }

  const resetDeposit = () => {}

  if (!EnabledTasks[Tasks.Multiply]) return <NotAllowed />
  if (!newContract) return <SomeError>Contract not found</SomeError>

  return (
    <>
      <EnablersLiquid
        contract={newContract}
        handleMarina={handleMarina}
        task={Tasks.Multiply}
      />
      <MarinaMultiplyModal
        contract={newContract}
        data={data}
        result={result}
        reset={resetDeposit}
        retry={() => {}}
        stage={stage}
        task={Tasks.Multiply}
      />
    </>
  )
}

export default MultiplyLiquid
