import type { NextPage } from 'next'
import Router, { useRouter } from 'next/router'
import { useContext, useEffect, useState } from 'react'
import SomeError from 'components/layout/error'
import Spinner from 'components/spinner'
import { getContract } from 'lib/contracts'
import { Contract, Tasks } from 'lib/types'
import { ContractsContext } from 'components/providers/contracts'
import Channel from 'components/channel'

const ContractRedeem: NextPage = () => {
  const { newContract, setNewContract } = useContext(ContractsContext)
  const [loading, setLoading] = useState(true)

  const router = useRouter()
  const { txid } = router.query

  useEffect(() => {
    if (txid && typeof txid === 'string') {
      getContract(txid).then((contract) => {
        if (contract) setNewContract(contract)
        setLoading(false)
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [txid])

  if (loading) return <Spinner />
  if (!newContract) return <SomeError>Contract not found</SomeError>

  return <Channel contract={newContract} task={Tasks.Redeem} />
}

export default ContractRedeem
