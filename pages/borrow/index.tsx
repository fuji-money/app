import type { NextPage } from 'next'
import { useEffect, useState } from 'react'
import SomeError from 'components/layout/error'
import Offers from 'components/offers'
import { fetchOffers } from 'lib/api'
import { Offer } from 'lib/types'
import Spinner from 'components/spinner'
import NotAllowed from 'components/messages/notAllowed'
import { EnabledTasks, Tasks } from 'lib/tasks'

const Borrow: NextPage = () => {
  const [offers, setOffers] = useState<Offer[]>()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    fetchOffers().then((data) => {
      setOffers(data)
      setLoading(false)
    })
  }, [])

  if (!EnabledTasks[Tasks.Borrow]) return <NotAllowed />
  if (loading) return <Spinner />
  if (!offers) return <SomeError>Error fetching offers</SomeError>

  return <Offers offers={offers} ticker="" />
}

export default Borrow
