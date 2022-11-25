/* eslint-disable react/display-name */
import Summary from 'components/contract/summary'
import Result from 'components/result'
import Spinner from 'components/spinner'
import { Contract } from 'lib/types'
import Modal, { ModalIds, ModalStages } from './modal'

interface MarinaDepositModalProps {
  contract: Contract
  data: string
  result: string
  retry: () => void
  reset: () => void
  stage: ModalStages
  task: string
}

const MarinaDepositModal = ({
  contract,
  data,
  result,
  retry,
  reset,
  stage,
  task,
}: MarinaDepositModalProps) => {
  const ModalTemplate = ({
    first,
    second,
    third,
  }: {
    first: string
    second: string
    third: string
  }) => (
    <>
      <Spinner />
      <h3 className="mt-4">{first}</h3>
      <p className="mb-1">{second}:</p>
      <div className="mx-auto">
        <Summary contract={contract} />
      </div>
      <p className="confirm">{third}</p>
    </>
  )

  let ModalContent = () => <></>

  switch (stage) {
    case ModalStages.NeedsCoins:
      ModalContent = () => (
        <ModalTemplate
          first="Selecting coins"
          second="Deposit to contract"
          third="Selecting coins needed for transaction"
        />
      )
      break
    case ModalStages.NeedsFujiApproval:
      ModalContent = () => (
        <ModalTemplate
          first="Preparing transaction"
          second="Proposing contract"
          third="Waiting for Fuji approval"
        />
      )
      break
    case ModalStages.NeedsConfirmation:
      ModalContent = () => (
        <ModalTemplate
          first="Approve transaction"
          second="Approving contract"
          third="Accept and unlock this transaction in your Marina wallet"
        />
      )
      break
    case ModalStages.NeedsFinishing:
      ModalContent = () => (
        <ModalTemplate
          first="Finishing"
          second="Creating contract"
          third="Broadcasting transaction"
        />
      )
      break
    case ModalStages.ShowResult:
      ModalContent = () => (
        <Result
          contract={contract}
          data={data}
          result={result}
          retry={retry}
          reset={reset}
          task={task}
        />
      )
      break
    default:
      break
  }

  return (
    <Modal id={ModalIds.MarinaDeposit} reset={reset}>
      <ModalContent />
    </Modal>
  )
}

export default MarinaDepositModal
