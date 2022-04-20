import { NextPage } from 'next'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import Borrow from 'components/borrow'
import SomeError from 'components/layout/error'
import Loading from 'components/layout/loading'
import Offers from 'components/offers'
import { fetchOffers } from 'lib/api'
import { Offer } from 'lib/types'

const BorrowTicker: NextPage = () => {
  const router = useRouter()
  const { params } = router.query
  const [offers, setOffers] = useState<Offer[]>()
  const [isLoading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    fetchOffers().then((data) => {
      setOffers(data)
      setLoading(false)
    })
  }, [])

  if (isLoading) return <Loading />
  if (!offers) return <SomeError>Error getting offers</SomeError>
  if (!params?.length || params.length > 2)
    return <SomeError>Invalid URL</SomeError>

  switch (params.length) {
    case 1:
      // /borrow/fBMN => show list of offers filtered by ticker
      return <Offers offers={offers} ticker={params[0]} />
    case 2:
      // /borrow/fBMN/LBTC => show form to borrow synthetic
      const offer = offers.find(
        ({ synthetic, collateral }) =>
          synthetic.ticker === params[0] && collateral.ticker === params[1],
      )
      if (!offer) return <SomeError>Offer not found</SomeError>
      return <Borrow offer={offer} />
    default:
      return <></>
  }
}

export default BorrowTicker
