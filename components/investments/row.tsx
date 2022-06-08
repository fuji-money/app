import { prettyNumber, prettyPercentage } from 'lib/pretty'
import Image from 'next/image'
import { Investment } from 'lib/types'

interface InvestmentRowProps {
  investment: Investment
}

const InvestmentRow = ({ investment }: InvestmentRowProps) => {
  const { asset, delta, quantity } = investment
  const deltaClass = delta < 0 ? 'delta red' : 'delta green'
  const invested = prettyNumber((quantity || 0) * asset.value, 2, 2)
  return (
    <div className="row">
      <div className="columns level">
        <div className="column is-flex is-3">
          <div className="pr-4">
            <Image
              alt="investment logo"
              height={60}
              src={asset.icon}
              width={40}
            />
          </div>
          <div className="is-purple my-auto">
            <p className="is-size-6 mb-0">{asset.name}</p>
            <p className="is-size-6 mb-0 has-text-weight-bold">
              {prettyNumber(quantity)} {asset.ticker}
            </p>
          </div>
        </div>
        <div className="column is-6 has-text-right is-purple">
          <p className="has-text-weight-bold">US ${invested}</p>
          <p className={deltaClass}>{prettyPercentage(delta)}</p>
        </div>
      </div>
    </div>
  )
}

export default InvestmentRow
