import Result from 'components/result'
import Spinner from 'components/spinner'
import Modal from './modal'

interface MarinaDepositModalProps {
  data: string
  result: string
  reset: () => void
  stage: string[]
}

const MarinaDepositModal = ({
  data,
  result,
  reset,
  stage,
}: MarinaDepositModalProps) => {
  const [mainMessage, secondaryMessage] = stage
  return (
    <Modal id="marina-deposit-modal" reset={reset}>
      {result && <Result data={data} result={result} reset={reset} />}
      {!result && (
        <>
          <Spinner />
          <h3 className="mt-4">{mainMessage}</h3>
          <p className="confirm">{secondaryMessage}</p>
        </>
      )}
    </Modal>
  )
}

export default MarinaDepositModal
