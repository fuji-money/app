import { useContext, useEffect, useState } from 'react'
import { fetchAssets } from 'lib/api'
import { WalletContext } from 'components/providers/wallet'
import Spinner from 'components/spinner'
import { prettyNumber, prettyPercentage } from 'lib/pretty'
import { getAssetBalance } from 'lib/marina'

const BalanceInFiat = () => {
  const [balance, setBalance] = useState(0)
  const [isLoading, setLoading] = useState(false)
  const { balances, connected } = useContext(WalletContext)

  const delta = -2345.67
  const calcDelta = () => prettyPercentage(delta / balance)
  const deltaClass = delta < 0 ? 'delta red' : 'delta green'

  useEffect(() => {
    setLoading(true)
    fetchAssets().then((data) => {
      setBalance(
        data.reduce((prev, asset) => {
          const quantity = getAssetBalance(asset, balances)
          prev += quantity * asset.value
          return prev
        }, 0),
      )
      setLoading(false)
    })
  }, [balances, connected])

  if (!connected) return <p>🔌 Connect your wallet to view your balance</p>
  if (isLoading) return <Spinner />

  return (
    <>
      <h2 className="is-gradient">US$ {prettyNumber(balance, 2, 2)}</h2>
      <p className={deltaClass}>
        {prettyNumber(delta, 2, 2)} {calcDelta()}
      </p>
    </>
  )
}

export default BalanceInFiat
