import { Contract } from 'lib/types'
import Summary from 'components/contract/summary'
import Spinner from 'components/spinner'
import Modal from './modal'

interface RedeemModalProps {
  contract: Contract | undefined
  assetBalance: number
  step: number
}

const RedeemModal = ({ contract, assetBalance, step }: RedeemModalProps) => {
  // messages to show on different steps of the process
  const mainMessage = [
    'Preparing the transaction...',
    'Waiting for confirmation...',
  ][step]
  const secondaryMessage = [
    'Looking for coins in your wallet...',
    'Confirm this transaction in your Marina wallet',
  ][step]

  // decision variables
  const ticker = contract?.synthetic.ticker
  const neededAmount = contract?.synthetic.quantity
  const hasFunds = contract && neededAmount && assetBalance >= neededAmount
  const noFunds = contract && neededAmount && assetBalance <  neededAmount

  return (
    <Modal id={'redeem-modal'}>
      {hasFunds && (
        <>
          <Spinner />
          <h3 className="mt-4">{mainMessage}</h3>
          <p>Redeem contract:</p>
          <Summary contract={contract} />
          <p className="confirm">{secondaryMessage}</p>
        </>
      )}
      {noFunds && (
        <>
          <h3 className="mt-4">Insufficient funds to redeem contract</h3>
          <p>You need <strong>{neededAmount} {ticker}</strong></p>
          <p>Your balance is <strong>{assetBalance} {ticker}</strong></p>
        </>
      )}
    </Modal>
  )
}

export default RedeemModal
