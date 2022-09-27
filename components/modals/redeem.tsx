import { Contract } from 'lib/types'
import Summary from 'components/contract/summary'
import Spinner from 'components/spinner'
import Modal from './modal'
import Result from 'components/result'

interface RedeemModalProps {
  balance: number
  contract: Contract | undefined
  data: string
  reset: () => void
  result: string
  stage: string[]
}

const RedeemModal = ({
  balance,
  contract,
  data,
  result,
  reset,
  stage,
}: RedeemModalProps) => {
  // messages to show on different steps of the process
  const [mainMessage, secondaryMessage] = stage

  // decision variables
  const ticker = contract?.synthetic.ticker
  const neededAmount = contract?.synthetic.quantity
  const hasFunds = neededAmount && balance >= neededAmount

  return (
    <Modal id={'redeem-modal'} reset={reset}>
      {result && <Result data={data} reset={reset} result={result} />}
      {!result && hasFunds && (
        <>
          <Spinner />
          <h3 className="mt-4">{mainMessage}</h3>
          <p>Redeem contract:</p>
          <div className="mx-auto">
            <Summary contract={contract} />
          </div>
          <p className="confirm">{secondaryMessage}</p>
        </>
      )}
      {!result && !hasFunds && (
        <>
          <h3 className="mt-4">Insufficient funds to redeem contract</h3>
          <p>
            You need{' '}
            <strong>
              {neededAmount} {ticker}
            </strong>
          </p>
          <p>
            Your balance is{' '}
            <strong>
              {balance} {ticker}
            </strong>
          </p>
        </>
      )}
    </Modal>
  )
}

export default RedeemModal
