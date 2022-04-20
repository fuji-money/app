import Notification from './notification'

const RatioTooLowNotification = () => {
  const label = 'Ratio below minimum allowed'
  const type = 'danger'
  return <Notification label={label} type={type} />
}

export default RatioTooLowNotification
