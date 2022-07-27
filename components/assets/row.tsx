import { prettyAmount, prettyNumber, prettyQuantity } from 'lib/pretty'
import Image from 'next/image'
import { Asset } from 'lib/types'
import FilterButton from 'components/buttons/filter'
import TradeButton from 'components/buttons/trade'

interface AssetRowProps {
  asset: Asset
}

const AssetRow = ({ asset }: AssetRowProps) => {
  return (
    <div className={`is-box has-pink-border row ${!asset.isAvailable && `disabled`}`}>
      <div className="columns level">
        <div className="column is-flex is-3">
          <div className="pr-4">
            <Image alt="asset logo" height={60} src={asset.icon} width={40} />
          </div>
          <div className="is-purple my-auto">
            <p className="is-size-6 mb-0">{asset.name}</p>
            <p className="is-size-6 mb-0 has-text-weight-bold">
              {prettyQuantity(asset)} {asset.ticker}
            </p>
          </div>
        </div>
        <div className="column is-3">
          <p className="has-text-weight-bold is-gradient">
            {prettyAmount(asset)}
          </p>
        </div>
        <div className="column is-6 has-text-right">
          {
            asset.isAvailable ?
              (
                <>
                  <TradeButton />
                  <FilterButton ticker={asset.ticker} />
                </>
              ) : (
                <p className="is-size-6 has-text-weight-bold has-text-right mr-3">
                  Coming soon
                </p>
              )
          }
        </div>
      </div>
      <style jsx>{`
        .disabled {
          opacity: 0.5;
        }
      `}</style>
    </div>
  )
}

export default AssetRow
