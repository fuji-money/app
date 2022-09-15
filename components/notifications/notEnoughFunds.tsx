import Notification from './notification'

const NotEnoughFundsNotification = ({ oob }: { oob: boolean }) => {
  const label = 'Not enough funds on Marina'
  const type = oob ? 'danger' : 'warning'
  return <Notification label={label} type={type} />
}

export default NotEnoughFundsNotification
