import Modal from './modal'
import { sleep } from 'lib/utils'
import QRCode from 'components/qrcode'
import { useState } from 'react'
import Result from 'components/result'
import Spinner from 'components/spinner'

interface LightningDepositModalProps {
  data: string
  invoice: string
  result: string
  reset: () => void
  stage: string[]
}

const LightningDepositModal = ({
  data,
  invoice,
  result,
  reset,
  stage,
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

  const [mainMessage, secondaryMessage] = stage

  return (
    <Modal id="lightning-deposit-modal" reset={reset}>
      {result && <Result data={data} result={result} reset={reset} />}
      {!result && (
        <>
          <Spinner />
          <h3 className="mt-4">{mainMessage}</h3>
          {invoice && <QRCode text={invoice} />}
          <p className="confirm">{secondaryMessage}</p>
          {invoice && (
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
