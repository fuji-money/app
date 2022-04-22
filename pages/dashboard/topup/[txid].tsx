import type { NextPage } from 'next'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import SomeError from 'components/layout/error'
import Topup from 'components/topup'
import { getContract } from 'lib/marina'
import { Contract } from 'lib/types'
import Spinner from 'components/spinner'

const TopupContract: NextPage = () => {
  const [contract, setContract] = useState<Contract>()
  const [isLoading, setLoading] = useState(false)

  const router = useRouter()
  const { txid } = router.query

  useEffect(() => {
    if (txid && typeof txid === 'string') {
      setLoading(true)
      getContract(txid).then((contract) => {
        setContract(contract)
        setLoading(false)
      })
    }
  }, [txid])

  if (isLoading) return <Spinner />
  if (!contract) return <SomeError>Contract not found</SomeError>

  return <Topup contract={contract} />
}

export default TopupContract
