import Notification from './notification'

const RatioUnsafeNotification = () => {
  const label = 'Ratio is unsafe'
  const type = 'warning'
  return <Notification label={label} type={type} />
}

export default RatioUnsafeNotification
