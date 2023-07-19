import { useContext, useEffect, useState } from 'react'
import { fetchInvestments } from 'lib/api'
import { Investment } from 'lib/types'
import SomeError from 'components/layout/error'
import InvestmentRow from './row'
import Spinner from 'components/spinner'
import { WalletContext } from 'components/providers/wallet'
import { ContractsContext } from 'components/providers/contracts'

const InvestmentsList = () => {
  const { wallets } = useContext(WalletContext)
  const { loading } = useContext(ContractsContext)
  const [investments, setInvestments] = useState<Investment[]>()

  useEffect(() => {
    if (wallets.length) {
      wallets[0].getNetwork().then(fetchInvestments).then(setInvestments)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wallets.length])

  if (loading) return <Spinner />
  if (!investments) return <SomeError>Error getting investments</SomeError>

  return (
    <div className="is-box has-pink-border has-pink-background mb-6">
      {investments &&
        investments.map((investment: Investment, index: number) => (
          <InvestmentRow key={index} investment={investment} />
        ))}
    </div>
  )
}

export default InvestmentsList
