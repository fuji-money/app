import Notification from './notification'

const LowCollateralAmountNotification = () => {
  const label = 'Collateral amount too low'
  const type = 'danger'
  return <Notification label={label} type={type} />
}

export default LowCollateralAmountNotification