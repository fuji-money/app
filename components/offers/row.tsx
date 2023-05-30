import { prettyNumber } from 'lib/pretty'
import Image from 'next/image'
import { Asset, Offer } from 'lib/types'
import BorrowButton from 'components/buttons/borrow'

interface IconProps {
  asset: Asset
}

const Icon = ({ asset }: IconProps) => {
  return (
    <Image src={asset.icon} alt="{asset.ticker} logo" width="40" height="40" />
  )
}

interface OfferRowProps {
  offer: Offer
}

const OfferRow = ({ offer }: OfferRowProps) => {
  return (
    <div
      className={`is-box has-pink-border row ${
        !offer.isAvailable && 'disabled'
      }`}
    >
      <div className="columns level">
        <div className="column is-flex is-2">
          <div className="icon-container">
            <Icon asset={offer.synthetic} />
          </div>
          <div className="icon-container">
            <Icon asset={offer.collateral} />
          </div>
          <div className="is-gradient my-auto has-text-weight-bold">
            <p className="is-size-7 mb-0">{offer.synthetic.name}</p>
            <p className="is-size-7 mb-0">{offer.synthetic.ticker}</p>
          </div>
        </div>
        <div className="column is-2">
          <p className="is-gradient">{offer.collateral.ticker}</p>
        </div>
        <div className="column is-2">
          <p className="is-gradient">{`>${offer.synthetic.minCollateralRatio}%`}</p>
        </div>
        <div className="column is-2">
          <p className="amount is-gradient">
            US$ {prettyNumber(offer.synthetic.value, 2, 2)}
          </p>
        </div>
        <div className="column is-4 has-text-right">
          {offer.isAvailable ? (
            <BorrowButton
              collateral={offer.collateral.ticker}
              synthetic={offer.synthetic.ticker}
            />
          ) : (
            <p className="is-size-6 has-text-weight-bold has-text-right mr-3">
              Coming soon
            </p>
          )}
        </div>
      </div>
      <style jsx>{`
        div.icon-container:nth-child(1) {
          z-index: 10;
        }
        div.icon-container:nth-child(2) {
          position: relative;
          left: -12px;
        }
        .disabled {
          opacity: 0.5;
        }
      `}</style>
    </div>
  )
}

export default OfferRow
