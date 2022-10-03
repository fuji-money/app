import type { NextPage } from 'next'
import { useContext } from 'react'
import { ContractsContext } from 'components/providers/contracts'
import EnablersLightning from 'components/enablers/lightning'
import { Tasks } from 'lib/types'

const ContractTaskLightning: NextPage = () => {
  const { newContract } = useContext(ContractsContext)

  if (!newContract) throw new Error('Missing contract')

  return (
    <EnablersLightning
      contract={newContract}
      handleInvoice={() => {}}
      task={Tasks.Topup}
    />
  )
}

export default ContractTaskLightning
