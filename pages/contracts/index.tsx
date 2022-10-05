import type { NextPage } from 'next'
import Contracts from 'components/contracts'
import { ContractsContext } from 'components/providers/contracts'
import { useContext, useEffect } from 'react'

const ContractsList: NextPage = () => {
  const { resetContracts } = useContext(ContractsContext)

  useEffect(() => {
    resetContracts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return <Contracts />
}

export default ContractsList
