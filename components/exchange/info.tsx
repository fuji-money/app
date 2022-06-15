import { useState } from "react"
import ExchangeOverview from "./overview"
import ExchangeTransactions from "./transactions"


const ExchangeInfo = () => {
  const [showOverview, setShowOverview] = useState(true)
  return (
    <>
      <div className="row mb-6">
        <div className="columns has-text-centered">
          <div className="column is-6">
            <p
              className={`is-tab-selector ${showOverview ? 'active' : ''}`}
              onClick={() => setShowOverview(!showOverview)}
            >
              Overview
            </p>
          </div>
          <div className="column is-6">
            <p
              className={`is-tab-selector ${showOverview ? '' : 'active'}`}
              onClick={() => setShowOverview(!showOverview)}
            >
              Transactions
            </p>
          </div>
        </div>
      </div>
      {showOverview ? <ExchangeOverview /> : <ExchangeTransactions />}
    </>
  )
}

export default ExchangeInfo
