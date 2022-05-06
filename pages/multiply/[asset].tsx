import type { NextPage } from 'next'
import { useEffect, useState } from 'react'
import Splash from 'components/multiply/splash'
import Multiply from 'components/multiply'
import { useRouter } from 'next/router'
import { Offer } from 'lib/types'
import { fetchOffers } from 'lib/api'
import SomeError from 'components/layout/error'
import Spinner from 'components/spinner'

const MultiplyAsset: NextPage = () => {
  const router = useRouter()
  const { asset } = router.query
  const [multiply, setMultiply] = useState(false)
  const [offers, setOffers] = useState<Offer[]>()
  const [isLoading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    fetchOffers().then((data) => {
      setOffers(data)
      setLoading(false)
    })
  }, [])

  if (isLoading) return <Spinner />
  if (!offers) return <SomeError>Error getting offers</SomeError>

  const offer = offers.find(
    ({ synthetic, collateral }) =>
      synthetic.ticker === asset && collateral.ticker === 'LBTC'
  )

  if (!offer) return <SomeError>Error getting offer</SomeError>

  if (multiply) return <Multiply offer={offer} />
  return <Splash click={() => setMultiply(true)} />
}

export default MultiplyAsset

