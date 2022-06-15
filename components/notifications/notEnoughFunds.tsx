import Notification from './notification'

const NotEnoughFundsNotification = () => {
  const label = 'Not enough funds'
  const type = 'danger'
  return <Notification label={label} type={type} />
}

export default NotEnoughFundsNotification
