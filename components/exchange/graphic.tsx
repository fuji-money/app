import BalanceInFiat from 'components/balance/fiat'
import Image from 'next/image'
import { useState } from 'react'

const ExchangeGraphic = () => {
  const [period, setPeriod] = useState('Day')

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
      <Image src="/images/graph.svg" alt="graphic" width={877} height={410} />
    </div>
  )
}

export default ExchangeGraphic
