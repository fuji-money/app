import type { NextPage } from 'next'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import SomeError from 'components/layout/error'
import Loading from 'components/layout/loading'
import Topup from 'components/topup'
import { getContracts } from 'lib/marina'
import { Contract } from 'lib/types'

const TopupContract: NextPage = () => {
  const [contract, setContract] = useState<Contract>()
  const [isLoading, setLoading] = useState(false)

  const router = useRouter()
  const { txid } = router.query

  useEffect(() => {
    setLoading(true)
    getContracts().then((contracts) => {
      const contract = contracts.find((c) => c.txid === txid)
      setContract(contract)
      setLoading(false)
    })
  }, [txid])

  if (isLoading) return <Loading />
  if (!contract) return <SomeError>Contract not found</SomeError>

  return <Topup contract={contract} />
}

export default TopupContract
