import type { NextPage } from 'next'
import Contracts from 'components/contracts'
import { ContractsContext } from 'components/providers/contracts'
import { useContext } from 'react'

const ContractsList: NextPage = () => {
  const { resetContracts } = useContext(ContractsContext)

  resetContracts()

  return <Contracts />
}

export default ContractsList
