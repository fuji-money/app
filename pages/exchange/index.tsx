import Investments from 'components/investments'
import TotalBalance from 'components/investments/balance'
import NotAllowed from 'components/messages/notAllowed'
import Stocks from 'components/stocks'
import { EnabledTasks, Tasks } from 'lib/tasks'
import type { NextPage } from 'next'

const ExchangePage: NextPage = () => {
  if (!EnabledTasks[Tasks.Topup]) return <NotAllowed />

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
