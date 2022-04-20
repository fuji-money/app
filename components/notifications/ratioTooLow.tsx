import Notification from './notification'

const RatioTooLowNotification = () => {
  const label = 'Ratio too low'
  const type = 'danger'
  return <Notification label={label} type={type} />
}

export default RatioTooLowNotification
