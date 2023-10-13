import { prettyNumber } from 'lib/pretty'
import { Asset } from 'lib/types'
import { fromSatoshis } from 'lib/utils'
import Image from 'next/image'

interface CollateralProps {
  asset: Asset
}

const Collateral = ({ asset }: CollateralProps) => {
  return (
    <>
      <div className="level has-pink-border has-pink-background">
        <div className="level-left">
          <div className="level-item">
            <p className="ml-3 mt-1">
              <Image
                src={asset.icon}
                alt="collateral icon"
                height="24"
                width="24"
              />
            </p>
            <p className="ml-3 my-auto">{asset.ticker}</p>
          </div>
        </div>
        <div className="level-right">
          <div className="level-item">
            <p className="mr-3 my-auto">
              {prettyNumber(fromSatoshis(asset.quantity, asset.precision))}
            </p>
          </div>
        </div>
      </div>
      <p className="usd-amount">
        {prettyNumber(
          fromSatoshis(asset.quantity, asset.precision) * asset.value,
          0,
          2,
        )}{' '}
        USD
      </p>
      <style jsx>{`
        .level {
          margin-bottom: 0.6rem;
          min-height: 45px;
        }
        .usd-amount {
          color: #6b1d9c;
          font-size: 0.6rem;
          font-weight: 700;
          margin-bottom: 1rem;
          margin-right: 1rem;
          text-align: right;
        }
      `}</style>
    </>
  )
}

export default Collateral
