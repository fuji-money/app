import SomeError from "components/layout/error"
import Spinner from "components/spinner"
import { fetchInvestments } from "lib/api"
import { Investment } from "lib/types"
import { useEffect, useState } from "react"
import InvestmentsList from "./list"

const Investments = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [investments, setInvestments] = useState<Investment[]>()

  useEffect(() => {
    setIsLoading(true)
    fetchInvestments().then(data => {
      setInvestments(data)
      setIsLoading(false)
    })
  }, [])

  if (isLoading) return <Spinner />
  if (!investments) return <SomeError>Error fetching investments</SomeError>

  return (
    <section>
      <h2>Investments</h2>
      <div className="has-pink-border has-pink-background mb-6">
        <InvestmentsList />
      </div>
    </section>
  )
}

export default Investments
