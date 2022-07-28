import Notification from './notification'

const BelowDustLimitNotification = () => {
  const label = 'Transaction below dust limit'
  const type = 'danger'
  return <Notification label={label} type={type} />
}

export default BelowDustLimitNotification