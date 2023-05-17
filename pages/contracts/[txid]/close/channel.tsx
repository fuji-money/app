import type { NextPage } from 'next'
import { useRouter } from 'next/router'
import { useContext, useEffect, useState } from 'react'
import SomeError from 'components/layout/error'
import Spinner from 'components/spinner'
import { getContract } from 'lib/contracts'
import { EnabledTasks, Tasks } from 'lib/tasks'
import { ContractsContext } from 'components/providers/contracts'
import Channel from 'components/channel'
import NotAllowed from 'components/messages/notAllowed'
import { WalletContext } from 'components/providers/wallet'

const ContractRedeemChannel: NextPage = () => {
  const { network } = useContext(WalletContext)
  const { newContract, setNewContract } = useContext(ContractsContext)
  const [isLoading, setIsLoading] = useState(true)

  const router = useRouter()
  const { txid } = router.query

  useEffect(() => {
    if (txid && typeof txid === 'string') {
      getContract(txid, network).then((contract) => {
        if (contract) setNewContract(contract)
        setIsLoading(false)
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [txid])

  if (!EnabledTasks[Tasks.Redeem]) return <NotAllowed />
  if (isLoading) return <Spinner />
  if (!newContract) return <SomeError>Contract not found</SomeError>

  return <Channel contract={newContract} task={Tasks.Redeem} />
}

export default ContractRedeemChannel
