import { prettyNumber } from 'lib/pretty'
import { Contract } from 'lib/types'
import { closeModal, fromSatoshis, openModal } from 'lib/utils'
import Image from 'next/image'
import { prepareBorrowTx, proposeBorrowContract } from 'lib/covenant'
import { getXPubKey, signAndBroadcastTx } from 'lib/marina'
import { useContext } from 'react'
import { WalletContext } from 'components/providers/wallet'
import { createNewContract } from 'lib/contracts'
import { ContractsContext } from 'components/providers/contracts'

interface MarinaProps {
  contract: Contract
  setData: any
  setResult: any
  setStep: any
  topup: number | undefined
}

const Marina = ({
  contract,
  setData,
  setResult,
  setStep,
  topup,
}: MarinaProps) => {
  const { ticker, value } = contract.collateral
  const quantity = topup || contract.collateral.quantity
  const { network } = useContext(WalletContext)
  const { reloadContracts } = useContext(ContractsContext)
  return (
    <>
      <div className="is-flex">
        <div className="pt-6 mt-5 mr-6">
          <button
            className="button is-primary mt-2"
            onClick={async () => {
              openModal('deposit-modal')
              try {
                const preparedTx = await prepareBorrowTx(contract, network)
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
                createNewContract(contract)
                setData(contract.txid)
                setResult('success')
                reloadContracts()
              } catch (error) {
                setData(error instanceof Error ? error.message : error)
                setResult('failure')
              }
              closeModal('deposit-modal')
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
    </>
  )
}

export default Marina
