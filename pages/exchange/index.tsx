import Investments from 'components/investments'
import TotalBalance from 'components/investments/balance'
import Stocks from 'components/stocks'
import type { NextPage } from 'next'

const ExchangePage: NextPage = () => {
  return (
    <section>
      <h1>Exchange</h1>
      <div className="is-box has-pink-border">
        <TotalBalance />
        <Investments />
        <Stocks />
      </div>
    </section>
  )
}

export default ExchangePage
