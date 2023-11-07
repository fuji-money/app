import { WalletType } from 'lib/wallet'
import Notification from './notification'

function typeToString(t: WalletType): string {
  switch (t) {
    case WalletType.Marina:
      return 'Marina'
    case WalletType.Alby:
      return 'Alby'
    default:
      return ''
  }
}

const NotEnoughFundsNotification = ({
  oob,
  wallet,
}: {
  oob: boolean
  wallet: WalletType
}) => {
  const label = `Not enough funds on ${typeToString(wallet)}`
  const type = oob ? 'danger' : 'warning'
  return <Notification label={label} type={type} />
}

export default NotEnoughFundsNotification
