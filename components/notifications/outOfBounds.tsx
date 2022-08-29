import Notification from './notification'

const OutOfBoundsNotification = ({ nef }: { nef: boolean }) => {
  const label = 'Amount out of bounds for Lightning swap'
  const type = nef ? 'danger' : 'warning'
  return <Notification label={label} type={type} />
}

export default OutOfBoundsNotification
