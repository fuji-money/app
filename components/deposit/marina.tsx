import { prettyNumber } from 'lib/pretty'
import { Contract } from 'lib/types'
import { fromSatoshis, openModal } from 'lib/utils'
import DepositModal from 'components/modals/deposit'
import Image from 'next/image'
import { prepareBorrowTx, proposeBorrowContract } from 'lib/covenant'
import { getXPubKey, signAndBroadcastTx } from 'lib/marina'
import { useContext, useState } from 'react'
import { WalletContext } from 'components/providers/wallet'
import { createContract } from 'lib/contracts'
import { ContractsContext } from 'components/providers/contracts'

interface MarinaProps {
  contract: Contract
  setData: any
  setResult: any
  topup: number | undefined
}

const Marina = ({ contract, setData, setResult, topup }: MarinaProps) => {
  const { ticker, value } = contract.collateral
  const [step, setStep] = useState(0)
  const quantity = topup || contract.collateral.quantity
  const { network } = useContext(WalletContext)
  const { updateContracts } = useContext(ContractsContext)
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
                const { partialTransaction } = await proposeBorrowContract(
                  preparedTx,
                )
                setStep(1)
                contract.txid = await signAndBroadcastTx(partialTransaction)
                contract.borrowerPubKey = preparedTx.borrowerPublicKey
                contract.contractParams = preparedTx.contractParams
                contract.network = network
                contract.confirmed = false
                contract.xPubKey = await getXPubKey()
                createContract(contract)
                updateContracts()
                setData(contract.txid)
                setResult('success')
              } catch (error) {
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
      <DepositModal contract={contract} step={step} topup={topup} />
    </>
  )
}

export default Marina
