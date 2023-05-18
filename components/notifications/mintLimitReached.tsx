import Notification from './notification'

const MintLimitReachedNotification = () => {
  const label = 'Current maximum borrowing limit reached'
  const type = 'danger'
  return <Notification label={label} type={type} />
}

export default MintLimitReachedNotification
