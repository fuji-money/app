import { Contract } from 'lib/types'
import Summary from 'components/contract/summary'
import Spinner from 'components/spinner'
import Modal from './modal'
import Result from 'components/result'
import { useContext } from 'react'
import { WalletContext } from 'components/providers/wallet'
import { getAssetBalance } from 'lib/marina'

interface RedeemModalProps {
  contract: Contract
  data: string
  reset: () => void
  result: string
  retry: () => void
  stage: string[]
  task: string
}

const RedeemModal = ({
  contract,
  data,
  reset,
  result,
  retry,
  stage,
  task,
}: RedeemModalProps) => {
  const { balances } = useContext(WalletContext)

  if (!contract) return <></>

  // messages to show on different steps of the process
  const [mainMessage, secondaryMessage] = stage

  // decision variables
  const { synthetic } = contract
  const balance = getAssetBalance(synthetic, balances)
  const ticker = synthetic.ticker
  const neededAmount = synthetic.quantity
  const hasFunds = neededAmount && balance >= neededAmount

  return (
    <Modal id={'redeem-modal'} reset={reset}>
      {result && (
        <Result
          contract={contract}
          data={data}
          result={result}
          retry={retry}
          reset={reset}
          task={task}
        />
      )}
      {!result && hasFunds && (
        <>
          <Spinner />
          <h3 className="mt-4">{mainMessage}</h3>
          <p>Close contract:</p>
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
