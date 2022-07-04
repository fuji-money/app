import BalanceInFiat from 'components/balance/fiat'
import { useEffect, useState } from 'react'
import Chart from './chart'

const ExchangeGraphic = () => {
  const [period, setPeriod] = useState('Day')
  const [days, setDays] = useState(24)

  const tab = (p: string) => {
    const cn = `is-tab-selector ${period === p ? 'active' : ''}`
    const handleClick = () => setPeriod(p)
    return (
      <div className="column is-3">
        <p className={cn} onClick={handleClick}>
          {p}
        </p>
      </div>
    )
  }

  useEffect(() => {
    switch (period) {
      case 'Day':
        setDays(24)
        break
      case 'Week':
        setDays(7)
        break
      case 'Month':
        setDays(30)
        break
      case 'Year':
        setDays(365)
        break
      default:
        break
    }
  }, [period])

  return (
    <div className="is-box has-pink-border">
      <div className="mb-6">
        <BalanceInFiat />
      </div>
      <div className="row mb-6">
        <div className="columns has-text-centered">
          {tab('Day')}
          {tab('Week')}
          {tab('Month')}
          {tab('Year')}
        </div>
      </div>
      <Chart days={days} />
    </div>
  )
}

export default ExchangeGraphic
