import { Contract } from 'lib/types'
import Swap from 'components/deposit/swap'
import Marina from 'components/deposit/marina'
import Channel from 'components/deposit/channel'
import LightningDepositModal from 'components/modals/lightningDeposit'
import MarinaDepositModal from 'components/modals/marinaDeposit'
import { ContractsContext } from 'components/providers/contracts'
import { WalletContext } from 'components/providers/wallet'
import { useContext, useState } from 'react'
import { createNewContract, markContractTopup } from 'lib/contracts'
import {
  prepareTopupTx,
  proposeBorrowContract,
  proposeTopupContract,
} from 'lib/covenant'
import { signAndBroadcastTx, getXPubKey } from 'lib/marina'
import { openModal, extractError } from 'lib/utils'

interface TopupDepositProps {
  channel: string
  newContract: Contract
  oldContract: Contract
  setChannel: (arg0: string) => void
  setDeposit: (arg0: boolean) => void
}

const TopupDeposit = ({
  channel,
  newContract,
  oldContract,
  setChannel,
  setDeposit,
}: TopupDepositProps) => {
  const { network } = useContext(WalletContext)
  const { reloadContracts } = useContext(ContractsContext)

  const [data, setData] = useState('')
  const [result, setResult] = useState('')
  const [step, setStep] = useState(0)
  const [paid, setPaid] = useState(false)
  const [invoice, setInvoice] = useState('')

  const lightning = channel === 'lightning'
  const liquid = channel === 'liquid'

  const resetDeposit = () => {
    setChannel('')
    setDeposit(false)
  }

  const handleLightning = () => {} // TODO

  const handleMarina = async () => {
    openModal('marina-deposit-modal')
    try {
      // prepare topup transaction
      const preparedTx = await prepareTopupTx(newContract, oldContract, network)
      if (!preparedTx) throw new Error('Unable to prepare Tx')

      // propose contract to alpha factory
      const { partialTransaction } = await proposeTopupContract(preparedTx)
      if (!partialTransaction) throw new Error('Not accepted by Fuji')

      // show user (via modal) that contract proposal was accepted
      setStep(1)

      // add additional fields to contract and save to storage
      newContract.txid = await signAndBroadcastTx(partialTransaction)
      newContract.borrowerPubKey = preparedTx.borrowerPublicKey
      newContract.contractParams = preparedTx.contractParams
      newContract.network = network
      newContract.confirmed = false
      newContract.xPubKey = await getXPubKey()
      createNewContract(newContract)
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
      <div className="is-box has-pink-border p-6">
        {!channel && <Channel contract={newContract} setChannel={setChannel} />}
        {lightning && <Swap contract={newContract} handler={handleLightning} />}
        {liquid && <Marina contract={newContract} handler={handleMarina} />}
      </div>
      <MarinaDepositModal
        data={data}
        result={result}
        reset={resetDeposit}
        step={step}
      />
      <LightningDepositModal
        data={data}
        invoice={invoice}
        paid={paid}
        result={result}
        reset={resetDeposit}
      />
    </>
  )
}

export default TopupDeposit
