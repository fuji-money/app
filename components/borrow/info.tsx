import { getContractPayoutAmount } from 'lib/contracts'
import { prettyNumber, prettyQuantity } from 'lib/pretty'
import { Contract } from 'lib/types'
import { fromSatoshis } from 'lib/utils'

interface BorrowInfoProps {
  contract: Contract
}

const BorrowInfo = ({ contract }: BorrowInfoProps) => {
  const { collateral, priceLevel, synthetic } = contract
  const payoutAmount = getContractPayoutAmount(contract)
  return (
    <div className="is-box has-pink-border">
      <div className="level">
        <div className="level-left">
          <div className="level-item">
            <div>
              <p>Current reference price</p>
              <p>Liquidation price level</p>
              <p>Borrow amount</p>
              <p>Collateral amount</p>
              <p>Redemption fee</p>
            </div>
          </div>
        </div>
        <div className="level-right">
          <div className="level-item has-text-right">
            <div className="has-text-right">
              <p>{prettyNumber(collateral.value)}</p>
              <p>{prettyNumber(priceLevel)}</p>
              <p>{prettyQuantity(synthetic)} {synthetic.ticker}</p>
              <p>{prettyQuantity(collateral, 8)} {collateral.ticker}</p>
              <p>{prettyNumber(fromSatoshis(payoutAmount), 8)} {collateral.ticker}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BorrowInfo
