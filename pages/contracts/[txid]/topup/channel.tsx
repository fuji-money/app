import type { NextPage } from 'next'
import { useContext } from 'react'
import Channel from 'components/channel'
import { ContractsContext } from 'components/providers/contracts'
import SomeError from 'components/layout/error'
import { EnabledTasks, Tasks } from 'lib/tasks'
import NotAllowed from 'components/messages/notAllowed'

const ContractTopupMethod: NextPage = () => {
  const { newContract } = useContext(ContractsContext)

  if (!EnabledTasks[Tasks.Topup]) return <NotAllowed />
  if (!newContract) return <SomeError>Contract not found</SomeError>

  return <Channel contract={newContract} task={Tasks.Topup} />
}

export default ContractTopupMethod
