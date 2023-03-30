import { getContractPayoutAmount } from 'lib/contracts'
import { prettyExpirationDate, prettyNumber, prettyQuantity } from 'lib/pretty'
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
              <p>Borrow amount</p>
              <p>Current reference price</p>
              <p>Liquidation price level</p>
              <p>Collateral amount</p>
              <p>Redemption fee</p>
              <p>Expiration date</p>
            </div>
          </div>
        </div>
        <div className="level-right">
          <div className="level-item has-text-right">
            <div className="has-text-right">
              <p>
                {prettyQuantity(synthetic.quantity)} {synthetic.ticker}
              </p>
              <p>{prettyNumber(collateral.value, 2)} USD</p>
              <p>{prettyNumber(priceLevel)} USD</p>
              <p>
                {prettyQuantity(collateral.quantity, 8)} {collateral.ticker}
              </p>
              <p>
                {prettyNumber(fromSatoshis(payoutAmount), 8)}{' '}
                {collateral.ticker}
              </p>
              <p>{prettyExpirationDate(contract.expirationDate)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BorrowInfo
