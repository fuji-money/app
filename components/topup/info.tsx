import { getContractPayoutAmount } from 'lib/contracts'
import { prettyNumber, prettyQuantity } from 'lib/pretty'
import { Contract } from 'lib/types'
import { fromSatoshis } from 'lib/utils'

interface TopupInfoProps {
  newContract: Contract
  oldContract: Contract
}

const TopupInfo = ({ newContract, oldContract }: TopupInfoProps) => {
  const { collateral, synthetic } = oldContract
  const newPriceLevel = newContract.priceLevel
  const oldPriceLevel = oldContract.priceLevel
  const newPayoutAmount = getContractPayoutAmount(newContract)
  const oldPayoutAmount = getContractPayoutAmount(oldContract)
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
              <p>{prettyNumber(collateral.value, 2)} USD</p>
              <p>
                {prettyNumber(oldPriceLevel)} &rarr;{' '}
                {prettyNumber(newPriceLevel)} USD
              </p>
              <p>
                {prettyQuantity(synthetic.quantity)} {synthetic.ticker}
              </p>
              <p>
                {prettyQuantity(oldContract.collateral.quantity, 8)} &rarr;{' '}
                {prettyQuantity(newContract.collateral.quantity, 8)}{' '}
                {collateral.ticker}
              </p>
              <p>
                {prettyNumber(fromSatoshis(oldPayoutAmount), 8)} &rarr;{' '}
                {prettyNumber(fromSatoshis(newPayoutAmount), 8)}{' '}
                {collateral.ticker}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TopupInfo
