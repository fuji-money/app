import { useEffect, useState } from 'react'
import { fetchStocks } from 'lib/api'
import { Stock } from 'lib/types'
import SomeError from 'components/layout/error'
import StockRow from './row'
import Spinner from 'components/spinner'

const StocksList = () => {
  const [stocks, setStocks] = useState<Stock[]>()
  const [isLoading, setLoading] = useState(false)

  useEffect(() => {
    fetchStocks().then((data) => {
      setStocks(data)
      setLoading(false)
    })
  }, [])

  if (isLoading) return <Spinner />
  if (!stocks) return <SomeError>Error getting stocks</SomeError>

  return (
    <div className="stocks-list">
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
