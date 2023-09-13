import Notification from './notification'

const TdexErrorNotification = ({ error }: { error: string }) => {
  return <Notification label={error} type={'danger'} />
}

export default TdexErrorNotification
