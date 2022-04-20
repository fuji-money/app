import { prettyNumber } from 'lib/pretty'
import { Contract } from 'lib/types'

interface BorrowInfoProps {
  contract: Contract
}

const BorrowInfo = ({ contract }: BorrowInfoProps) => {
  const { payout, synthetic } = contract
  const { quantity, ticker, value } = synthetic
  return (
    <div className="is-box">
      <div className="level">
        <div className="level-left">
          <div className="level-item">
            <div>
              <p>Oracle price</p>
              <p>Borrowing fee</p>
            </div>
          </div>
        </div>
        <div className="level-right">
          <div className="level-item has-text-right">
            <div className="has-text-right">
              <p>
                1 {ticker} = {prettyNumber(value)} USDt
              </p>
              <p>
                {prettyNumber(((quantity || 0) * value * payout) / 100)} USDt
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BorrowInfo
