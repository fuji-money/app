import type { NextPage } from 'next'
import { useRouter } from 'next/router'
import { useContext, useEffect, useState } from 'react'
import SomeError from 'components/layout/error'
import Spinner from 'components/spinner'
import { getContract } from 'lib/contracts'
import Topup from 'components/topup'
import { ContractsContext } from 'components/providers/contracts'
import NotAllowed from 'components/messages/notAllowed'
import { EnabledTasks, Tasks } from 'lib/tasks'

const ContractTopup: NextPage = () => {
  const [loading, setLoading] = useState(true)

  const { newContract, setNewContract, setOldContract } =
    useContext(ContractsContext)

  const router = useRouter()
  const { txid } = router.query

  useEffect(() => {
    if (txid && typeof txid === 'string') {
      getContract(txid).then((contract) => {
        if (contract) {
          setNewContract(contract)
          setOldContract(contract)
        }
        setLoading(false)
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [txid])

  if (!EnabledTasks[Tasks.Topup]) return <NotAllowed />
  if (loading) return <Spinner />
  if (!newContract) return <SomeError>Contract not found</SomeError>

  return <Topup />
}

export default ContractTopup
