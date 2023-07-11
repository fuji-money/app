import { useContext } from 'react'
import { WalletContext } from 'components/providers/wallet'
import InvestButton from './button'
import BalanceInFiat from 'components/balance/fiat'

const TotalBalance = () => {
  const { wallet } = useContext(WalletContext)

  if (!wallet?._isConnected()) return <p>🔌 Connect your wallet to view your balance</p>

  return (
    <div className="level mb-6">
      <div className="level-left is-block">
        <BalanceInFiat />
      </div>
      <div className="level-right">
        <InvestButton />
      </div>
    </div>
  )
}

export default TotalBalance
