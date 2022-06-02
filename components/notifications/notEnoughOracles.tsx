import Notification from './notification'

const NotEnoughOraclesNotification = () => {
  const label = 'Not enough oracles'
  const type = 'danger'
  return <Notification label={label} type={type} />
}

export default NotEnoughOraclesNotification
