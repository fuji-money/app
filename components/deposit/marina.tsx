import { prettyNumber } from 'lib/pretty'
import { Contract } from 'lib/types'
import { closeModal, openModal } from 'lib/utils'
import MarinaModal from 'components/modals/marina'
import Image from 'next/image'
import { makeBorrowTx } from 'lib/marina'

interface MarinaProps {
  contract: Contract
  topup: number | undefined
  setResult: any
}

const Marina = ({ contract, topup, setResult }: MarinaProps) => {
  const { ticker, value } = contract.collateral
  const quantity = topup || contract.collateral.quantity
  return (
    <>
      <div className="is-flex">
        <div className="pt-6 mt-5 mr-6">
          <button
            className="button is-primary mt-2"
            onClick={async () => {
              openModal('marina-modal')
              await makeBorrowTx(contract)
              setResult('success')
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
                {prettyNumber(quantity)} {ticker}
              </p>
              <p>US$ {prettyNumber((quantity || 0) * value)}</p>
            </div>
          </div>
        </div>
      </div>
      <p className="is-size-7 mt-6">
        In vivamus mi pretium pharetra cursus lacus, elit. Adipiscing eget vel
        ut non duis vitae. Augue mi, bibendum ac imperdiet ipsum sed ornare.
        Facilisis id sem quam elementum euismod ante ut. Ac, pharetra elit, sit
        pharetra a. Eu diam nunc nulla risus arcu, integer nulla diam, est. Nisl
        accumsan potenti mattis consectetur pellentesque.
      </p>
      <MarinaModal contract={contract} setResult={setResult} topup={topup} />
    </>
  )
}

export default Marina
