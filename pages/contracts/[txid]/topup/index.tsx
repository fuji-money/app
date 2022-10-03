import type { NextPage } from 'next'
import { useRouter } from 'next/router'
import { useContext, useEffect, useState } from 'react'
import SomeError from 'components/layout/error'
import Spinner from 'components/spinner'
import { getContract } from 'lib/contracts'
import Topup from 'components/topup'
import { Contract } from 'lib/types'
import { ContractsContext } from 'components/providers/contracts'

const ContractTopup: NextPage = () => {
  const [contract, setContract] = useState<Contract>()
  const [loading, setLoading] = useState(true)

  const { setNewContract, setOldContract } = useContext(ContractsContext)

  const router = useRouter()
  const { txid } = router.query

  useEffect(() => {
    if (txid && typeof txid === 'string') {
      getContract(txid).then((contract) => {
        if (contract) setContract(contract)
        setLoading(false)
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [txid])

  if (loading) return <Spinner />
  if (!contract) return <SomeError>Contract not found</SomeError>

  setNewContract(contract)
  setOldContract(contract)

  return <Topup />
}

export default ContractTopup
