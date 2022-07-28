import { getContractPayout } from 'lib/contracts'
import { prettyNumber } from 'lib/pretty'
import { Contract } from 'lib/types'
import { fromSatoshis } from 'lib/utils'

interface BorrowInfoProps {
  contract: Contract
}

const BorrowInfo = ({ contract }: BorrowInfoProps) => {
  const { collateral, payout, synthetic } = contract
  const { ticker, value } = collateral
  const payoutAmount = getContractPayout(contract)
  return (
    <div className="is-box has-pink-border">
      <div className="level">
        <div className="level-left">
          <div className="level-item">
            <div>
              <p>Oracle price</p>
              <p>Payout amount</p>
              <p>Collateral price</p>
            </div>
          </div>
        </div>
        <div className="level-right">
          <div className="level-item has-text-right">
            <div className="has-text-right">
              <p>
                1 {synthetic.ticker} = {prettyNumber(synthetic.value)} USDt
              </p>
              <p>
                {payout}% = {prettyNumber(payoutAmount)} {ticker}
              </p>
              <p>
                1 {ticker} = {prettyNumber(value)} USDt
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BorrowInfo
