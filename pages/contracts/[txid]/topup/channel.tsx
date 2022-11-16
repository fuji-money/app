import type { NextPage } from 'next'
import { useContext } from 'react'
import Channel from 'components/channel'
import { ContractsContext } from 'components/providers/contracts'
import SomeError from 'components/layout/error'
import { EnabledTasks, Tasks } from 'lib/tasks'
import NotAllowed from 'components/messages/notAllowed'

const ContractTopupChannel: NextPage = () => {
  const { newContract, oldContract } = useContext(ContractsContext)

  if (!EnabledTasks[Tasks.Topup]) return <NotAllowed />
  if (!newContract) return <SomeError>Contract not found</SomeError>

  const amount =
    newContract.collateral.quantity - (oldContract?.collateral.quantity || 0)

  return <Channel amount={amount} contract={newContract} task={Tasks.Topup} />
}

export default ContractTopupChannel
