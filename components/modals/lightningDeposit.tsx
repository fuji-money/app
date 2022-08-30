import Modal from './modal'
import { ReverseSwap } from 'lib/swaps'
import { sleep } from 'lib/utils'
import QRCode from 'components/qrcode'
import { useState } from 'react'
import Result from 'components/result'

interface LightningDepositModalProps {
  data: string
  invoice: string
  paid: boolean
  result: string
}

const LightningDepositModal = ({
  data,
  invoice,
  paid,
  result,
}: LightningDepositModalProps) => {
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

  const mainMessage = paid ? 'Payment received' : 'Deposit by scaning this QR'
  const secondaryMessage = paid
    ? 'Waiting for Fuji approval'
    : 'Waiting for payment'

  return (
    <Modal id="lightning-deposit-modal">
      {result && <Result data={data} result={result} />}
      {!result && (
        <>
          <h3 className="mt-4">{mainMessage}</h3>
          {!paid && invoice && <QRCode text={invoice} />}
          <p className="confirm">{secondaryMessage}</p>
          {!paid && invoice && (
            <p className="has-text-centered mt-4">
              <button onClick={handleCopy} className="button">
                {buttonText}
              </button>
            </p>
          )}
        </>
      )}
    </Modal>
  )
}

export default LightningDepositModal
