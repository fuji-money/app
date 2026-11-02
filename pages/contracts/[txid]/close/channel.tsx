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
import { ConfigContext } from 'components/providers/config'

const ContractRedeemChannel: NextPage = () => {
  const { network } = useContext(WalletContext)
  const { config, loading: configLoading } = useContext(ConfigContext)
  const { newContract, setNewContract } = useContext(ContractsContext)
  const [isLoading, setIsLoading] = useState(true)

  const { assets } = config

  const router = useRouter()
  const { txid } = router.query

  // Assets come from the factory, or from the offline fallback. Wait for that
  // before deciding the contract is missing, otherwise redeem opens on an
  // empty list while config is still loading.
  useEffect(() => {
    if (!txid || typeof txid !== 'string' || !network || configLoading) return
    if (assets.length === 0) {
      setIsLoading(false)
      return
    }
    let cancelled = false
    getContract(txid, assets, network).then((contract) => {
      if (cancelled) return
      if (contract) setNewContract(contract)
      setIsLoading(false)
    })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assets, configLoading, network, txid])

  if (!EnabledTasks[Tasks.Redeem]) return <NotAllowed />
  if (isLoading) return <Spinner />
  if (!newContract) return <SomeError>Contract not found</SomeError>

  return <Channel contract={newContract} task={Tasks.Redeem} />
}

export default ContractRedeemChannel
