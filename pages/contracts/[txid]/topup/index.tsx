import type { NextPage } from 'next'
import { useRouter } from 'next/router'
import { useContext, useEffect, useState } from 'react'
import SomeError from 'components/layout/error'
import Spinner from 'components/spinner'
import Topup from 'components/topup'
import { ContractsContext } from 'components/providers/contracts'
import NotAllowed from 'components/messages/notAllowed'
import { EnabledTasks, Tasks } from 'lib/tasks'

const ContractTopup: NextPage = () => {
  const { newContract, setNewContract, setOldContract, getContract } =
    useContext(ContractsContext)

  const [isLoading, setIsLoading] = useState(true)

  const router = useRouter()
  const { txid } = router.query

  useEffect(() => {
    if (typeof txid !== 'string') return
    const contract = getContract(txid)
    if (contract) {
      if (!newContract) setNewContract(contract)
      setOldContract(contract)
    }
    setIsLoading(false)

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [txid])

  if (!EnabledTasks[Tasks.Topup]) return <NotAllowed />
  if (isLoading) return <Spinner />
  if (!newContract) return <SomeError>Contract not found</SomeError>

  return <Topup />
}

export default ContractTopup
