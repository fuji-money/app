import { prettyExpirationDate, prettyNumber, prettyQuantity } from 'lib/pretty'
import { Contract } from 'lib/types'
import { fromSatoshis } from 'lib/utils'

interface MultiplyInfoProps {
  contract: Contract
}

const MultiplyInfo = ({ contract }: MultiplyInfoProps) => {
  const { collateral, exposure, priceLevel, synthetic } = contract
  const multiple = (exposure ?? 0) / collateral.quantity

  return (
    <div className="is-box has-pink-border is-size-7">
      <div className="level">
        <div className="level-left">
          <div className="level-item">
            <div>
              <p>Fuji debt</p>
              <p>Current reference price</p>
              <p>Liquidation price level</p>
              <p>Collateral amount</p>
              <p>{collateral.ticker} exposure</p>
              <p>{collateral.ticker} multiple</p>
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
              <p>{prettyNumber(priceLevel)} USD</p>
              <p>
                {prettyQuantity(
                  collateral.quantity,
                  collateral.precision,
                  collateral.precision,
                )}{' '}
                {collateral.ticker}
              </p>
              <p>
                {prettyQuantity(
                  exposure,
                  collateral.precision,
                  collateral.precision,
                )}{' '}
                {collateral.ticker}
              </p>
              <p>{prettyNumber(multiple, 0, 2)}</p>
              <p>{prettyExpirationDate(contract.expirationDate)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MultiplyInfo
