import { useEffect, useState } from 'react'
import Image from 'next/image'
import { openModal } from 'lib/utils'
import { fetchAsset, fetchOracles } from 'lib/api'
import { Asset, Contract, Offer, Oracle } from 'lib/types'
import Spinner from 'components/spinner'
import SomeError from 'components/layout/error'
import ExchangeOverview from './overview'
import ExchangeTransactions from './transactions'

interface ExchangeFormProps {
  offer: Offer
}

const ExchangeForm = ({ offer }: ExchangeFormProps) => {
  const [showOverview, setShowOverview] = useState(true)
  const { synthetic } = offer

  return (
    <div className="row">
      <div className="columns">
        <div className="column is-4">
          <div className="is-box has-pink-border mb-6">
            <div className="level">
              <div className="level-left is-block">
                <h2>{synthetic.name}</h2>
                <p className="is-size-7 is-grey">{synthetic.ticker}</p>
              </div>
              <div className="level-left">
                <Image
                  alt="asset logo"
                  height={60}
                  src={synthetic.icon}
                  width={40}
                />
              </div>
            </div>
            <div className="level">
              <p>
                <span className="is-after">Buy</span>
              </p>
              <p>
                <span className="is-after">Sell</span>
              </p>
              <p>
                <span className="is-after">Statement</span>
              </p>
            </div>
          </div>
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
        </div>
        <div className="column is-1"></div>
        <div className="column is-7">
          <div className="is-box has-pink-border">
            <p>Graph</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ExchangeForm
