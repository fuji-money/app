import type { NextPage } from 'next'
import { useRouter } from 'next/router'
import { useContext, useEffect, useState } from 'react'
import SomeError from 'components/layout/error'
import Spinner from 'components/spinner'
import { EnabledTasks, Tasks } from 'lib/tasks'
import { ContractsContext } from 'components/providers/contracts'
import Channel from 'components/channel'
import NotAllowed from 'components/messages/notAllowed'
import { extractError } from 'lib/utils'

const ContractRedeemChannel: NextPage = () => {
  const { newContract, setNewContract, getContract } =
    useContext(ContractsContext)
  const [error, setError] = useState<string>()
  const [isLoading, setIsLoading] = useState(true)

  const router = useRouter()
  const { txid } = router.query

  useEffect(() => {
    try {
      if (typeof txid !== 'string') return
      const contract = getContract(txid)
      if (!contract) {
        throw new Error('Contract not found')
      }
      setNewContract(contract)
    } catch (e) {
      setError(extractError(e))
    } finally {
      setIsLoading(false)
    }
  }, [getContract, setNewContract, txid])

  if (!EnabledTasks[Tasks.Redeem]) return <NotAllowed />
  if (isLoading) return <Spinner />
  if (error) return <SomeError>{error}</SomeError>
  if (!newContract) return <SomeError>Contract not found</SomeError>

  return <Channel contract={newContract} task={Tasks.Redeem} />
}

export default ContractRedeemChannel
