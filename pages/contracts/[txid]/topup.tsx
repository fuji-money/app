import type { NextPage } from 'next'
import { useRouter } from 'next/router'
import { Dispatch, SetStateAction, useEffect, useState } from 'react'
import SomeError from 'components/layout/error'
import Topup from 'components/topup'
import { getContract } from 'lib/marina'
import { Contract, Oracle } from 'lib/types'
import Spinner from 'components/spinner'
import { fetchOracles } from 'lib/api'

const ContractTopup: NextPage = () => {
  const [contract, setContract] = useState<Contract>()
  const [isLoading, setLoading] = useState(false)
  const [oracles, setOracles] = useState<Oracle[]>()

  const router = useRouter()
  const { txid } = router.query

  useEffect(() => {
    if (txid && typeof txid === 'string') {
      setLoading(true)
      fetchOracles().then((data) => {
        setOracles(data)
        getContract(txid).then((contract) => {
          if (contract) setContract(contract)
          setLoading(false)
        })
      })
    }
  }, [txid])

  if (isLoading) return <Spinner />
  if (!contract) return <SomeError>Contract not found</SomeError>
  if (!oracles) return <SomeError>Oracles not found</SomeError>

  return (
    <Topup
      contract={contract}
      oracles={oracles}
      setContract={setContract as any}
    />
  )
}

export default ContractTopup
