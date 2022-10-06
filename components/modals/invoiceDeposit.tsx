import Modal, { ModalStages } from './modal'
import { sleep } from 'lib/utils'
import QRCode from 'components/qrcode'
import { useState } from 'react'
import Result from 'components/result'
import Spinner from 'components/spinner'
import { Contract } from 'lib/types'
import Summary from 'components/contract/summary'
import Image from 'next/image'

interface InvoiceDepositModalProps {
  contract: Contract
  data: string
  invoice: string
  result: string
  reset: () => void
  retry: () => void
  stage: string[]
  task: string
}

const InvoiceDepositModal = ({
  contract,
  data,
  invoice,
  result,
  reset,
  retry,
  stage,
  task,
}: InvoiceDepositModalProps) => {
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

  const [mainMessage, secondaryMessage] = stage
  const showInvoice = stage === ModalStages.NeedsPayment
  const showReceived = stage === ModalStages.PaymentReceived

  return (
    <Modal id="invoice-deposit-modal" reset={reset}>
      {result && (
        <Result
          contract={contract}
          data={data}
          result={result}
          reset={reset}
          retry={retry}
          task={task}
        />
      )}
      {!result && (
        <>
          {showInvoice ? (
            <>
              <Spinner />
              <h3 className="mt-4">{mainMessage}</h3>
              <QRCode text={invoice} />
              <p className="confirm">{secondaryMessage}</p>
              <p className="has-text-centered mt-4">
                <button onClick={handleCopy} className="button">
                  {buttonText}
                </button>
              </p>
            </>
          ) : (
            <>
              {showReceived ? (
                <>
                  <p>
                    <Image
                      src={`/images/status/success.svg`}
                      alt="status icon"
                      height={100}
                      width={100}
                    />
                  </p>
                  <h3 className="mt-4">{mainMessage}</h3>
                </>
              ) : (
                <>
                  <Spinner />
                  <h3 className="mt-4">{mainMessage}</h3>
                  <p>Deposit to contract:</p>
                  <div className="mx-auto">
                    <Summary contract={contract} />
                  </div>
                </>
              )}
              <p className="confirm">{secondaryMessage}</p>
            </>
          )}
        </>
      )}
    </Modal>
  )
}

export default InvoiceDepositModal
