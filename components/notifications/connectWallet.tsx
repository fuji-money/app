import Notification from './notification'

const ConnectWalletNotification = () => {
  const label = "Can't proceed without a connected wallet"
  const type = 'danger'
  return <Notification label={label} type={type} />
}

export default ConnectWalletNotification
