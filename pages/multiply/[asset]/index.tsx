import type { NextPage } from 'next'
import { useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { Offer } from 'lib/types'
import SomeError from 'components/layout/error'
import Spinner from 'components/spinner'
import { TICKERS } from 'lib/assets'
import { ContractsContext } from 'components/providers/contracts'
import { ConfigContext } from 'components/providers/config'
import MultiplyForm from 'components/multiply/form'

const MultiplyAsset: NextPage = () => {
  const { config } = useContext(ConfigContext)
  const { loading, setNewContract } = useContext(ContractsContext)

  const [offer, setOffer] = useState<Offer>()

  const { offers } = config

  const router = useRouter()
  const { asset } = router.query

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

  return <MultiplyForm offer={offer} />
}

export default MultiplyAsset
