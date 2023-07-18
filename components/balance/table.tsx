import { useContext } from 'react'
import BalanceRow from './row'
import Spinner from 'components/spinner'
import { ContractsContext } from 'components/providers/contracts'
import { ConfigContext } from 'components/providers/config'
import { getAssetBalance } from 'lib/marina'
import { WalletType } from 'lib/wallet'

type Props = {
  wallet: WalletType
  balances: Record<string, number>
}

const BalanceTable: React.FC<Props> = ({ wallet, balances }) => {
  const { config } = useContext(ConfigContext)
  const { loading } = useContext(ContractsContext)

  const { assets } = config

  if (loading) return <Spinner />

  return (
    <>
      <h5>{wallet}</h5>
      <table className="table is-fullwidth">
        <thead>
          <tr>
            <th>Ticker</th>
            <th>
              <abbr title="Quantity" />
              Qty
            </th>
          </tr>
        </thead>
        <tbody>
          {assets &&
            assets.map((asset, index) => (
              <BalanceRow
                key={index}
                asset={asset}
                amount={getAssetBalance(asset, balances)}
              />
            ))}
        </tbody>
        <style jsx>{`
          table {
            font-size: 0.9rem;
          }
          td:nth-child(2),
          th:nth-child(2) {
            text-align: right;
          }
          td:nth-child(2) {
            color: #63159b;
          }
          img {
            height: 20px;
            position: relative;
            top: 4px;
          }
        `}</style>
      </table>
    </>
  )
}

export default BalanceTable
