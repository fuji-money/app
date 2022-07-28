import Notification from './notification'

const NotEnoughFundsNotification = () => {
  const label = 'Not enough funds on Marina'
  const type = 'warning'
  return <Notification label={label} type={type} />
}

export default NotEnoughFundsNotification
