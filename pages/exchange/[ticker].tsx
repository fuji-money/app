import type { NextPage } from 'next'
import { useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { Offer } from 'lib/types'
import SomeError from 'components/layout/error'
import Spinner from 'components/spinner'
import ExchangeDashboard from 'components/exchange/dashboard'
import NotAllowed from 'components/messages/notAllowed'
import { EnabledTasks, Tasks } from 'lib/tasks'
import { TICKERS } from 'lib/assets'
import { ContractsContext } from 'components/providers/contracts'
import { ConfigContext } from 'components/providers/config'

const ExchangeTicker: NextPage = () => {
  const { offers } = useContext(ConfigContext)
  const { loading } = useContext(ContractsContext)

  const [offer, setOffer] = useState<Offer>()

  const router = useRouter()
  const { ticker } = router.query

  useEffect(() => {
    if (ticker && typeof ticker === 'string') {
      setOffer(
        offers.find(
          (offer) =>
            offer.collateral.ticker === TICKERS.lbtc &&
            offer.synthetic.ticker === ticker,
        ),
      )
    }
  }, [offers, ticker])

  if (!EnabledTasks[Tasks.Topup]) return <NotAllowed />
  if (loading) return <Spinner />
  if (!offer) return <SomeError>Error getting offer</SomeError>

  return <ExchangeDashboard offer={offer} />
}

export default ExchangeTicker
