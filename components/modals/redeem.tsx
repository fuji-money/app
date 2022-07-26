import { Contract } from 'lib/types'
import Summary from 'components/contract/summary'
import Spinner from 'components/spinner'
import Modal from './modal'

interface RedeemModalProps {
  contract: Contract | undefined
  assetBalance: number
}

const RedeemModal = ({ contract, assetBalance }: RedeemModalProps) => {
  const ticker = contract?.synthetic.ticker
  const neededAmount = contract?.synthetic.quantity
  const hasFunds = contract && neededAmount && assetBalance >= neededAmount
  const noFunds = contract && neededAmount && assetBalance <  neededAmount

  return (
    <Modal id={'redeem-modal'}>
      {hasFunds && (
        <>
          <Spinner />
          <h3 className="mt-4">Waiting for confirmation...</h3>
          <p>Redeem contract:</p>
          <Summary contract={contract} />
          <p className="confirm">Confirm this transaction in your Marina wallet</p>
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
