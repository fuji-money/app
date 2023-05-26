import type { NextPage } from 'next'
import { useContext } from 'react'
import SomeError from 'components/layout/error'
import Offers from 'components/offers'
import Spinner from 'components/spinner'
import NotAllowed from 'components/messages/notAllowed'
import { EnabledTasks, Tasks } from 'lib/tasks'
import { ContractsContext } from 'components/providers/contracts'
import { ConfigContext } from 'components/providers/config'

const Borrow: NextPage = () => {
  const { config } = useContext(ConfigContext)
  const { loading } = useContext(ContractsContext)

  const { offers } = config

  if (!EnabledTasks[Tasks.Borrow]) return <NotAllowed />
  if (loading) return <Spinner />
  if (!offers) return <SomeError>Error fetching offers</SomeError>

  return <Offers offers={offers} ticker="" />
}

export default Borrow
