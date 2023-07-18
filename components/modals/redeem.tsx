/* eslint-disable react/display-name */
import { Contract } from 'lib/types'
import Summary from 'components/contract/summary'
import Spinner from 'components/spinner'
import Modal, { ModalIds, ModalStages } from './modal'
import Result from 'components/result'
import { useContext } from 'react'
import { WalletContext } from 'components/providers/wallet'
import { getAssetBalance } from 'lib/marina'
import { useSelectBalances } from 'lib/hooks'
import { WalletType } from 'lib/wallet'

interface RedeemModalProps {
  wallet: WalletType
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
  wallet,
}: RedeemModalProps) => {
  const { wallets } = useContext(WalletContext)
  const balances = useSelectBalances(wallets)

  if (!contract) return <></>

  // decision variables
  const { synthetic } = contract
  const balance = getAssetBalance(synthetic, balances[wallet])
  const ticker = synthetic.ticker
  const neededAmount = synthetic.quantity
  const hasFunds = neededAmount && balance >= neededAmount

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
      <p>{second}:</p>
      <div className="mx-auto">
        <Summary contract={contract} />
      </div>
      <p className="confirm">{third}</p>
    </>
  )

  if (!result && !hasFunds) {
    return (
      <Modal id={ModalIds.Redeem} reset={reset}>
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

  let ModalContent = () => <></>

  switch (stage) {
    case ModalStages.NeedsAddress:
      ModalContent = () => (
        <ModalTemplate
          first="Making swap"
          second="Close contract"
          third="Waiting for address"
        />
      )
      break
    case ModalStages.NeedsCoins:
      ModalContent = () => (
        <ModalTemplate
          first="Selecting coins"
          second="Close contract"
          third="Selecting coins needed for transaction"
        />
      )
      break
    case ModalStages.NeedsConfirmation:
      ModalContent = () => (
        <ModalTemplate
          first="Approve transaction"
          second="Close contract"
          third="Accept and unlock this transaction in your Marina wallet"
        />
      )
      break
    case ModalStages.NeedsFinishing:
      ModalContent = () => (
        <ModalTemplate
          first="Finishing"
          second="Close contract"
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
          task={task}
        />
      )
      break
    default:
      break
  }

  return (
    <Modal id={ModalIds.Redeem} reset={reset}>
      <ModalContent />
    </Modal>
  )
}

export default RedeemModal
