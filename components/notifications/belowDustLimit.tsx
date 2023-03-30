import Notification from './notification'

const BelowDustLimitNotification = () => {
  const label = 'Minting fee below dust limit'
  const type = 'danger'
  return <Notification label={label} type={type} />
}

export default BelowDustLimitNotification
