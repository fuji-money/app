import { minDustLimit } from 'lib/constants'
import Notification from './notification'

interface BorrowFeeNotificationProps {
  payout: number
}

const BorrowFeeNotification = ({ payout }: BorrowFeeNotificationProps) => {
  const label = `A fixed fee of ${minDustLimit} satoshis + ${payout}% fee of the collateral value will be levied when the borrow position is closed`
  const type = 'warning'
  return <Notification label={label} type={type} />
}

export default BorrowFeeNotification
