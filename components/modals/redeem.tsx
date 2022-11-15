import { Contract } from 'lib/types'
import Summary from 'components/contract/summary'
import Spinner from 'components/spinner'
import Modal, { ModalStages } from './modal'
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
  stage: ModalStages
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

  // decision variables
  const { synthetic } = contract
  const balance = getAssetBalance(synthetic, balances)
  const ticker = synthetic.ticker
  const neededAmount = synthetic.quantity
  const hasFunds = neededAmount && balance >= neededAmount
  const modalId = 'redeem-modal'

  const ModalContent = ({
    first,
    second,
    third,
  }: {
    first: string
    second: string
    third: string
  }) => (
    <Modal id={modalId} reset={reset}>
      <Spinner />
      <h3 className="mt-4">{first}</h3>
      <p>{second}:</p>
      <div className="mx-auto">
        <Summary contract={contract} />
      </div>
      <p className="confirm">{third}</p>
    </Modal>
  )

  if (!result && !hasFunds) {
    return (
      <Modal id={modalId} reset={reset}>
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
      </Modal>
    )
  }

  if (stage === ModalStages.NeedsAddress) {
    return (
      <ModalContent
        first="Making swap"
        second="Close contract"
        third="Waiting for address"
      />
    )
  }

  if (stage === ModalStages.NeedsCoins) {
    return (
      <ModalContent
        first="Selecting coins"
        second="Close contract"
        third="Selecting coins needed for transaction"
      />
    )
  }

  if (stage === ModalStages.NeedsConfirmation) {
    return (
      <ModalContent
        first="Approve transaction"
        second="Close contract"
        third="Accept and unlock this transaction in your Marina wallet"
      />
    )
  }

  if (stage === ModalStages.NeedsFinishing) {
    return (
      <ModalContent
        first="Finishing"
        second="Close contract"
        third="Broadcasting transaction"
      />
    )
  }

  if (stage === ModalStages.ShowResult) {
    return (
      <Modal id={modalId} reset={reset}>
        <Result
          contract={contract}
          data={data}
          result={result}
          retry={retry}
          reset={reset}
          task={task}
        />
      </Modal>
    )
  }

  return <></>
}

export default RedeemModal
