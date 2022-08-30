import { Contract } from 'lib/types'
import Image from 'next/image'
import { prettyNumber } from 'lib/pretty'
import { fromSatoshis, sleep } from 'lib/utils'
import { ReverseSwap } from 'lib/swaps'
import QRCode from 'components/qrcode'
import { useState } from 'react'

interface SwapProps {
  contract: Contract
  swap: ReverseSwap
}

const Swap = ({ contract, swap }: SwapProps) => {
  const { invoice, invoiceAmount } = swap
  const { ticker, value } = contract.collateral
  const [buttonText, setButtonText] = useState('Copy')

  const handleCopy = () => {
    navigator.clipboard.writeText(invoice).then(
      () => {
        setButtonText('Copied')
        sleep(5000).then(() => setButtonText('Copy'))
      },
      (err) => console.error('Could not copy text: ', err),
    )
  }

  return (
    <>
      <div className="is-flex is-justify-content-space-between">
        <p>
          <QRCode text={invoice} />
        </p>
        <div className="is-flex is-flex-direction-column is-justify-content-center">
          <h2 className="has-text-weight-bold is-size-4 mb-4">
            Deposit by Scaning this QR
          </h2>
          <div>
            <div className="has-pink-border info-card px-5 py-4">
              <p className="amount">Amount to deposit</p>
              <p className="quantity">
                {prettyNumber(fromSatoshis(invoiceAmount))} {ticker}
              </p>
              <p className="value">
                US$ {prettyNumber(fromSatoshis(invoiceAmount) * value, 0, 2)}
              </p>
            </div>
          </div>
        </div>
      </div>
      <p className="invoice is-size-7 mt-6 is-overflow-anywhere">{invoice}</p>
      <p className="has-text-centered mt-4">
        <button onClick={handleCopy} className="button is-primary">
          {buttonText}
        </button>
      </p>
    </>
  )
}

export default Swap
