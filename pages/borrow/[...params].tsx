import { NextPage } from 'next'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import Borrow from 'components/borrow'
import SomeError from 'components/layout/error'
import Offers from 'components/offers'
import { fetchOffers, fetchOracles } from 'lib/api'
import { Offer, Oracle } from 'lib/types'
import Spinner from 'components/spinner'

const BorrowTicker: NextPage = () => {
  const router = useRouter()
  const { params } = router.query
  const [offers, setOffers] = useState<Offer[]>()
  const [isLoading, setLoading] = useState(false)
  const [oracles, setOracles] = useState<Oracle[]>()

  useEffect(() => {
    setLoading(true)
    fetchOracles().then((data) => {
      setOracles(data)
      fetchOffers().then((data) => {
        setOffers(data)
        setLoading(false)
      })
    })
  }, [])

  if (isLoading) return <Spinner />
  if (!offers) return <SomeError>Error getting offers</SomeError>
  if (!oracles) return <SomeError>Oracles not found</SomeError>
  if (!params || params.length > 2) return <SomeError>Invalid URL</SomeError>

  switch (params.length) {
    case 1:
      // /borrow/fBMN => show list of offers filtered by ticker
      return <Offers offers={offers} ticker={params[0]} />
    case 2:
      // /borrow/fBMN/L-BTC => show form to borrow synthetic
      const offer = offers.find(
        ({ synthetic, collateral }) =>
          synthetic.ticker === params[0] && collateral.ticker === params[1],
      )
      if (!offer) return <SomeError>Offer not found</SomeError>
      return <Borrow offer={offer} oracles={oracles} />
    default:
      return <></>
  }
}

export default BorrowTicker
