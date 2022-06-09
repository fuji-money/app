import { Offer, TradeTypes } from 'lib/types'
import { useState } from 'react'
import ExchangeGraphic from './graphic'
import ExchangeHero from './hero'
import ExchangeInfo from './info'
import ExchangeTrade from './trade'

interface ExchangeDashboardProps {
  offer: Offer
}

const ExchangeDashboard = ({ offer }: ExchangeDashboardProps) => {
  const [trade, setTrade] = useState(TradeTypes.None)

  const { synthetic } = offer

  return (
    <div className="row">
      <div className="columns">
        <div className="column is-4">
          {trade === TradeTypes.None ? (
            <>
              <ExchangeHero setTrade={setTrade} synthetic={synthetic} />
              <ExchangeInfo />
            </>
          ) : trade === TradeTypes.Statement ? (
            <p>Statement</p>
          ) : (
            <ExchangeTrade setTrade={setTrade} synthetic={synthetic} trade={trade} />
          )}
        </div>
        <div className="column is-1"></div>
        <div className="column is-7">
          <ExchangeGraphic />
        </div>
      </div>
    </div>
  )
}

export default ExchangeDashboard
