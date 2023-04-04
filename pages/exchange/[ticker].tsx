import type { NextPage } from 'next'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { Offer } from 'lib/types'
import { fetchAsset, fetchOffer } from 'lib/api'
import SomeError from 'components/layout/error'
import Spinner from 'components/spinner'
import ExchangeDashboard from 'components/exchange/dashboard'
import NotAllowed from 'components/messages/notAllowed'
import { EnabledTasks, Tasks } from 'lib/tasks'

const ExchangeTicker: NextPage = () => {
  const router = useRouter()
  const { ticker } = router.query

  const [offer, setOffer] = useState<Offer>()
  const [isLoading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    if (ticker && typeof ticker === 'string') {
      fetchAsset(ticker).then((asset) => {
        if (asset) {
          fetchOffer(asset.ticker, 'L-BTC').then((data) => {
            setOffer(data)
            setLoading(false)
          })
        }
      })
    }
  }, [ticker])

  if (!EnabledTasks[Tasks.Topup]) return <NotAllowed />
  if (isLoading) return <Spinner />
  if (!offer) return <SomeError>Error getting offer</SomeError>

  return <ExchangeDashboard offer={offer} />
}

export default ExchangeTicker
