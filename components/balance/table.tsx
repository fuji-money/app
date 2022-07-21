import { useContext, useEffect, useState } from 'react'
import { fetchAssets } from 'lib/api'
import { Asset } from 'lib/types'
import { WalletContext } from 'components/providers/wallet'
import BalanceRow from './row'
import Spinner from 'components/spinner'
import { NetworkContext } from 'components/providers/network'

const BalanceTable = () => {
  const [assets, setAssets] = useState<Asset[]>()
  const [isLoading, setLoading] = useState(false)
  const { wallet } = useContext(WalletContext)
  const { network } = useContext(NetworkContext)

  useEffect(() => {
    setLoading(true)
    fetchAssets().then((data) => {
      setAssets(data)
      setLoading(false)
    })
  }, [wallet, network])

  if (!wallet) return <p>🔌 Connect your wallet to view your balance</p>
  if (isLoading) return <Spinner />

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
