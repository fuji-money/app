import { WalletContext } from 'components/providers/wallet'
import BalanceTable from './table'
import { useContext } from 'react'
import { WalletType } from 'lib/wallet'

const Balance = () => {
  const { balances } = useContext(WalletContext)

  return (
    <div className="is-box has-pink-border">
      <h3>Your balance</h3>
      {Object.entries(balances).map(([wallet, balances]) => (
        <BalanceTable
          key={wallet}
          wallet={wallet as WalletType}
          balances={balances}
        />
      ))}
    </div>
  )
}

export default Balance
