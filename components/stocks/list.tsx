import { useContext, useEffect, useState } from 'react'
import { fetchStocks } from 'lib/api'
import { Stock } from 'lib/types'
import SomeError from 'components/layout/error'
import StockRow from './row'
import Spinner from 'components/spinner'
import { WalletContext } from 'components/providers/wallet'
import { ContractsContext } from 'components/providers/contracts'

const StocksList = () => {
  const { network } = useContext(WalletContext)
  const { loading } = useContext(ContractsContext)
  const [stocks, setStocks] = useState<Stock[]>()

  useEffect(() => {
    fetchStocks(network).then(setStocks)
  }, [network])

  if (loading) return <Spinner />
  if (!stocks) return <SomeError>Error getting stocks</SomeError>

  return (
    <div className="stocks-list is-box no-shadow mb-6">
      {stocks &&
        stocks.map((stock: Stock, index: number) => (
          <StockRow key={index} stock={stock} />
        ))}
      <style jsx>{`
        div.stocks-list {
          display: flex;
        }
      `}</style>
    </div>
  )
}

export default StocksList
