import Notification from './notification'

const ConnectWalletNotification = () => {
  const label = 'Connect your wallet'
  const type = 'danger'
  return <Notification label={label} type={type} />
}

export default ConnectWalletNotification
