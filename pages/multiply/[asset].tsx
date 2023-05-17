import type { NextPage } from 'next'
import { useContext, useEffect, useState } from 'react'
import Multiply from 'components/multiply'
import { useRouter } from 'next/router'
import { Offer } from 'lib/types'
import SomeError from 'components/layout/error'
import Spinner from 'components/spinner'
import { TICKERS } from 'lib/assets'
import { ContractsContext } from 'components/providers/contracts'

const MultiplyAsset: NextPage = () => {
  const router = useRouter()
  const { asset } = router.query

  const { loading, offers } = useContext(ContractsContext)

  const [offer, setOffer] = useState<Offer>()

  useEffect(() => {
    if (asset === 'btc-long') {
      setOffer(
        offers.find(
          (offer) =>
            offer.collateral.ticker === TICKERS.lbtc &&
            offer.synthetic.ticker === TICKERS.fuji,
        ),
      )
    }
  }, [asset, offers])

  if (loading) return <Spinner />
  if (!offer) return <SomeError>Error getting offer</SomeError>

  return <Multiply offer={offer} />
}

export default MultiplyAsset
