import Notification from './notification'

const BelowDustLimitNotification = () => {
  const label = 'Redemption fee below dust limit'
  const type = 'danger'
  return <Notification label={label} type={type} />
}

export default BelowDustLimitNotification
