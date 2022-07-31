import { prettyNumber } from 'lib/pretty'
import { Contract } from 'lib/types'
import { fromSatoshis, openModal } from 'lib/utils'
import MarinaModal from 'components/modals/marina'
import Image from 'next/image'
import { prepareBorrowTx, proposeBorrowContract } from 'lib/covenant'
import { signAndBroadcastTx } from 'lib/marina'
import { addContractToStorage } from 'lib/storage'
import { useContext, useState } from 'react'
import { NetworkContext } from 'components/providers/network'

interface MarinaProps {
  contract: Contract
  setData: any
  setResult: any
  topup: number | undefined
}

const Marina = ({ contract, setData, setResult, topup }: MarinaProps) => {
  const { ticker, value } = contract.collateral
  const [ step, setStep ] = useState(0)
  const quantity = topup || contract.collateral.quantity
  const { network } = useContext(NetworkContext)
  return (
    <>
      <div className="is-flex">
        <div className="pt-6 mt-5 mr-6">
          <button
            className="button is-primary mt-2"
            onClick={async () => {
              openModal('marina-modal')
              try {
                const preparedTx = await prepareBorrowTx(contract)
                const { partialTransaction } = await proposeBorrowContract(preparedTx)
                setStep(1)
                contract.txid = await signAndBroadcastTx(partialTransaction)
                contract.network = network
                contract.borrowerPubKey = preparedTx.borrowerPublicKey
                contract.contractParams = preparedTx.contractParams
                addContractToStorage(contract) // add to local storage TODO
                setData(contract.txid)
                setResult('success')
              } catch(error) {
                setData(error instanceof Error ? error.message : error)
                setResult('failure')
              }
            }}
          >
            <Image
              src="/images/marina.svg"
              alt="marina logo"
              width={20}
              height={20}
            />
            <span className="ml-2">Deposit with Marina</span>
          </button>
        </div>
        <div className="is-flex is-flex-direction-column is-justify-content-center">
          <h2 className="has-text-weight-bold is-size-4 mb-4">
            Deposit with Marina Wallet
          </h2>
          <div>
            <div className="has-pink-border info-card px-5 py-4">
              <p>Amount to deposit</p>
              <p>
                {prettyNumber(fromSatoshis(quantity))} {ticker}
              </p>
              <p>US$ {prettyNumber((fromSatoshis(quantity) || 0) * value)}</p>
            </div>
          </div>
        </div>
      </div>
      <MarinaModal contract={contract} step={step} topup={topup} />
    </>
  )
}

export default Marina
