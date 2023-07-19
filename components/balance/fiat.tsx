import { useContext, useEffect, useState } from 'react'
import { WalletContext } from 'components/providers/wallet'
import Spinner from 'components/spinner'
import { prettyNumber, prettyPercentage } from 'lib/pretty'
import { getAssetBalance } from 'lib/marina'
import { ContractsContext } from 'components/providers/contracts'
import { ConfigContext } from 'components/providers/config'

const BalanceInFiat = () => {
  const { wallets, balances: balancesByWallet } = useContext(WalletContext)
  const { config } = useContext(ConfigContext)
  const { loading } = useContext(ContractsContext)

  const [balance, setBalance] = useState(0)

  const { assets } = config

  const delta = -2345.67
  const calcDelta = () => prettyPercentage(delta / balance)
  const deltaClass = delta < 0 ? 'delta red' : 'delta green'

  useEffect(() => {
    setBalance(
      assets.reduce((prev, asset) => {
        let quantity = 0
        for (const balances of Object.values(balancesByWallet)) {
          quantity += getAssetBalance(asset, balances)
        }
        return prev + quantity * asset.value
      }, 0),
    )
  }, [assets, balancesByWallet])

  if (!wallets || wallets.length === 0)
    return <p>🔌 Connect your wallet to view your balance</p>
  if (loading) return <Spinner />

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
