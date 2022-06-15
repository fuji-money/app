import { useEffect, useState } from 'react'
import { fetchInvestments } from 'lib/api'
import { Investment } from 'lib/types'
import SomeError from 'components/layout/error'
import InvestmentRow from './row'
import Spinner from 'components/spinner'

const InvestmentsList = () => {
  const [investments, setInvestments] = useState<Investment[]>()
  const [isLoading, setLoading] = useState(false)

  useEffect(() => {
    fetchInvestments().then((data) => {
      setInvestments(data)
      setLoading(false)
    })
  }, [])

  if (isLoading) return <Spinner />
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
