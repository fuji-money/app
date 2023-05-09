import type { NextPage } from 'next'
import { useContext, useEffect, useState } from 'react'
import SomeError from 'components/layout/error'
import Offers from 'components/offers'
import { fetchOffers } from 'lib/api'
import { Offer } from 'lib/types'
import Spinner from 'components/spinner'
import NotAllowed from 'components/messages/notAllowed'
import { EnabledTasks, Tasks } from 'lib/tasks'
import { ContractsContext } from 'components/providers/contracts'
import { WalletContext } from 'components/providers/wallet'

const Borrow: NextPage = () => {
  const { network } = useContext(WalletContext)
  const { resetContracts } = useContext(ContractsContext)
  const [offers, setOffers] = useState<Offer[]>()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    resetContracts()
    setLoading(true)
    fetchOffers(network).then((data) => {
      setOffers(data)
      setLoading(false)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!EnabledTasks[Tasks.Borrow]) return <NotAllowed />
  if (loading) return <Spinner />
  if (!offers) return <SomeError>Error fetching offers</SomeError>

  return <Offers offers={offers} ticker="" />
}

export default Borrow
