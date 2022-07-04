import type { NextPage } from 'next'
import { useEffect, useState } from 'react'
import Multiply from 'components/multiply'
import { useRouter } from 'next/router'
import { Offer } from 'lib/types'
import { fetchOffer } from 'lib/api'
import SomeError from 'components/layout/error'
import Spinner from 'components/spinner'

const MultiplyAsset: NextPage = () => {
  const router = useRouter()
  const { asset } = router.query

  const [offer, setOffer] = useState<Offer>()
  const [isLoading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    if (asset === 'btc-long') {
      fetchOffer('fUSD', 'L-BTC').then((data) => {
        setOffer(data)
        setLoading(false)
      })
    }
  }, [asset])

  if (isLoading) return <Spinner />
  if (!offer) return <SomeError>Error getting offer</SomeError>

  return <Multiply offer={offer} />
}

export default MultiplyAsset
