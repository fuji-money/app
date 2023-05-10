import { getContractPayoutAmount } from 'lib/contracts'
import { prettyExpirationDate, prettyNumber, prettyQuantity } from 'lib/pretty'
import { Contract } from 'lib/types'
import { fromSatoshis } from 'lib/utils'

interface TopupInfoProps {
  newContract: Contract
  oldContract: Contract
}

const TopupInfo = ({ newContract, oldContract }: TopupInfoProps) => {
  const { collateral, synthetic } = oldContract
  const newPriceLevel = newContract.priceLevel
  const newPayoutAmount = getContractPayoutAmount(newContract)
  return (
    <div className="is-box has-pink-border is-size-7">
      <div className="level">
        <div className="level-left">
          <div className="level-item">
            <div>
              <p>Borrow amount</p>
              <p>Current reference price</p>
              <p>Liquidation price level</p>
              <p>Collateral amount</p>
              <p>Minting fee</p>
              <p>Expiration date</p>
            </div>
          </div>
        </div>
        <div className="level-right">
          <div className="level-item has-text-right">
            <div className="has-text-right">
              <p>
                {prettyQuantity(synthetic.quantity, synthetic.precision)}{' '}
                {synthetic.ticker}
              </p>
              <p>{prettyNumber(collateral.value, 2, 2)} USD</p>
              <p>{prettyNumber(newPriceLevel, 0, 2)} USD</p>
              <p>
                {prettyQuantity(
                  newContract.collateral.quantity,
                  newContract.collateral.precision,
                )}{' '}
                {collateral.ticker}
              </p>
              <p>
                {prettyNumber(
                  fromSatoshis(newPayoutAmount, collateral.precision),
                  0,
                  collateral.precision,
                )}{' '}
                {collateral.ticker}
              </p>
              <p>{prettyExpirationDate(newContract.expirationDate)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TopupInfo
