import type { NextPage } from 'next'
import { useContext } from 'react'
import Channel from 'components/channel'
import { ContractsContext } from 'components/providers/contracts'
import SomeError from 'components/layout/error'
import { Tasks } from 'lib/types'

const ContractTopupMethod: NextPage = () => {
  const { newContract } = useContext(ContractsContext)

  if (!newContract) return <SomeError>Contract not found</SomeError>

  return <Channel contract={newContract} task={Tasks.Topup} />
}

export default ContractTopupMethod
