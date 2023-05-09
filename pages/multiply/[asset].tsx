import type { NextPage } from 'next'
import { useContext, useEffect, useState } from 'react'
import Multiply from 'components/multiply'
import { useRouter } from 'next/router'
import { Offer } from 'lib/types'
import { fetchOffer } from 'lib/api'
import SomeError from 'components/layout/error'
import Spinner from 'components/spinner'
import { WalletContext } from 'components/providers/wallet'
import { TICKERS } from 'lib/server'

const MultiplyAsset: NextPage = () => {
  const router = useRouter()
  const { asset } = router.query

  const { network } = useContext(WalletContext)

  const [offer, setOffer] = useState<Offer>()
  const [isLoading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    if (asset === 'btc-long') {
      fetchOffer(TICKERS.fuji, TICKERS.lbtc, network).then((data) => {
        setOffer(data)
        setLoading(false)
      })
    }
  }, [asset, network])

  if (isLoading) return <Spinner />
  if (!offer) return <SomeError>Error getting offer</SomeError>

  return <Multiply offer={offer} />
}

export default MultiplyAsset
