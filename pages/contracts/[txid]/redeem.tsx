import type { NextPage } from 'next'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import SomeError from 'components/layout/error'
import Redeem from 'components/redeem'
import { Contract } from 'lib/types'
import Spinner from 'components/spinner'
import { getContract } from 'lib/contracts'

const ContractRedeem: NextPage = () => {
  const [contract, setContract] = useState<Contract>()
  const [isLoading, setLoading] = useState(false)

  const router = useRouter()
  const { txid } = router.query

  useEffect(() => {
    if (txid && typeof txid === 'string') {
      setLoading(true)
      getContract(txid).then((contract) => {
        if (contract) setContract(contract)
        setLoading(false)
      })
    }
  }, [txid])

  if (isLoading) return <Spinner />
  if (!contract) return <SomeError>Contract not found</SomeError>

  return <Redeem contract={contract} />
}

export default ContractRedeem
