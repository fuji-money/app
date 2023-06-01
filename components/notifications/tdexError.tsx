import Notification from './notification'

const TdexErrorNotification = () => {
  const label = 'TDEX error'
  const type = 'danger'
  return <Notification label={label} type={type} />
}

export default TdexErrorNotification
