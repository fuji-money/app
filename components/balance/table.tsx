import { useContext } from 'react'
import { WalletContext } from 'components/providers/wallet'
import BalanceRow from './row'
import Spinner from 'components/spinner'
import { ContractsContext } from 'components/providers/contracts'
import { ConfigContext } from 'components/providers/config'

const BalanceTable = () => {
  const { wallet } = useContext(WalletContext)
  const { config } = useContext(ConfigContext)
  const { loading } = useContext(ContractsContext)

  const { assets } = config

  if (!wallet?._isConnected()) return <p>🔌 Connect your wallet to view your balance</p>
  if (loading) return <Spinner />

  return (
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
            <BalanceRow key={index} asset={asset} />
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
  )
}

export default BalanceTable
