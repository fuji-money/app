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
import { WalletContext } from 'components/providers/wallet'

const ContractTopup: NextPage = () => {
  const { network } = useContext(WalletContext)
  const { newContract, setNewContract, setOldContract } =
    useContext(ContractsContext)

  const [loading, setLoading] = useState(true)

  const router = useRouter()
  const { txid } = router.query

  useEffect(() => {
    if (txid && typeof txid === 'string') {
      getContract(txid, network).then((contract) => {
        if (contract) {
          if (!newContract) setNewContract(contract)
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
