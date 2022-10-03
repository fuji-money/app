import Summary from 'components/contract/summary'
import Result from 'components/result'
import Spinner from 'components/spinner'
import { Contract } from 'lib/types'
import Modal from './modal'

interface MarinaDepositModalProps {
  contract: Contract
  data: string
  result: string
  retry: () => void
  reset: () => void
  stage: string[]
}

const MarinaDepositModal = ({
  contract,
  data,
  result,
  retry,
  reset,
  stage,
}: MarinaDepositModalProps) => {
  const [mainMessage, secondaryMessage] = stage
  return (
    <Modal id="marina-deposit-modal" reset={reset}>
      {result && (
        <Result data={data} result={result} retry={retry} reset={reset} />
      )}
      {!result && (
        <>
          <Spinner />
          <h3 className="mt-4">{mainMessage}</h3>
          <p>Deposit to contract:</p>
          <div className="mx-auto">
            <Summary contract={contract} />
          </div>
          <p className="confirm">{secondaryMessage}</p>
        </>
      )}
    </Modal>
  )
}

export default MarinaDepositModal
