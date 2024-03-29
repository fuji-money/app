import SomeError from 'components/layout/error'
import Spinner from 'components/spinner'
import { fetchInvestments } from 'lib/api'
import { Investment } from 'lib/types'
import { useContext, useEffect, useState } from 'react'
import InvestmentsList from './list'
import { WalletContext } from 'components/providers/wallet'
import { ContractsContext } from 'components/providers/contracts'

const Investments = () => {
  const { network } = useContext(WalletContext)
  const { loading } = useContext(ContractsContext)
  const [investments, setInvestments] = useState<Investment[]>()

  useEffect(() => {
    if (network) {
      fetchInvestments(network).then((data) => {
        setInvestments(data)
      })
    }
  }, [network])

  if (loading) return <Spinner />
  if (!investments) return <SomeError>Error fetching investments</SomeError>

  return (
    <section>
      <h2 className="mb-4">Investments</h2>
      <InvestmentsList />
    </section>
  )
}

export default Investments
