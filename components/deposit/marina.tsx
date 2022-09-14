import { Contract } from 'lib/types'
import { extractError, openModal } from 'lib/utils'
import Image from 'next/image'
import { prepareBorrowTx, proposeBorrowContract } from 'lib/covenant'
import { getXPubKey, signAndBroadcastTx } from 'lib/marina'
import { useContext, useState } from 'react'
import { WalletContext } from 'components/providers/wallet'
import { createNewContract } from 'lib/contracts'
import { ContractsContext } from 'components/providers/contracts'
import Summary from 'components/contract/summary'
import MarinaDepositModal from 'components/modals/marinaDeposit'

interface MarinaProps {
  contract: Contract
  reset: () => void
}

const Marina = ({ contract, reset }: MarinaProps) => {
  const { network } = useContext(WalletContext)
  const { reloadContracts } = useContext(ContractsContext)
  const [data, setData] = useState('')
  const [result, setResult] = useState('')
  const [step, setStep] = useState(0)

  const resetMarinaDeposit = () => {
    setData('')
    setResult('')
    reset()
  }

  const handleMarina = async () => {
    openModal('marina-deposit-modal')
    try {
      // prepare borrow transaction
      const preparedTx = await prepareBorrowTx(contract, network)

      // propose contract to alpha factory
      const { partialTransaction } = await proposeBorrowContract(preparedTx)

      // show user (via modal) that contract proposal was accepted
      setStep(1)

      // add additional fields to contract and save to storage
      contract.txid = await signAndBroadcastTx(partialTransaction)
      contract.borrowerPubKey = preparedTx.borrowerPublicKey
      contract.contractParams = preparedTx.contractParams
      contract.network = network
      contract.confirmed = false
      contract.xPubKey = await getXPubKey()
      createNewContract(contract)

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
    <div className="columns">
      <div className="column is-6">
        <button className="button is-primary" onClick={handleMarina}>
          <Image
            src="/images/marina.svg"
            alt="marina logo"
            width={20}
            height={20}
          />
          <span className="ml-2">Deposit with Marina</span>
        </button>
        <style jsx>{`
          .button {
            justify-content: flex-start;
            width: 90%;
          }
        `}</style>
      </div>
      <div className="column is-6">
        <Summary contract={contract} />
      </div>
      <MarinaDepositModal
        data={data}
        result={result}
        reset={resetMarinaDeposit}
        step={step}
      />
    </div>
  )
}

export default Marina
