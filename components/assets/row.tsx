import { prettyQuantity } from 'lib/pretty'
import Image from 'next/image'
import { Asset } from 'lib/types'
import FilterButton from 'components/buttons/filter'
import TradeButton from 'components/buttons/trade'
import { useContext } from 'react'
import { WalletContext } from 'components/providers/wallet'
import { getAssetBalance } from 'lib/marina'
import ProgressBar from 'components/progress'

interface AssetRowProps {
  asset: Asset
}

const AssetRow = ({ asset }: AssetRowProps) => {
  const { balances } = useContext(WalletContext)
  const balance = getAssetBalance(asset, balances)
  return (
    <div
      className={`is-box has-pink-border row ${
        !asset.isAvailable && `disabled`
      }`}
    >
      <div className="columns level">
        <div className="column is-flex is-3">
          <div className="pr-4">
            <Image alt="asset logo" height={60} src={asset.icon} width={40} />
          </div>
          <div className="is-purple my-auto">
            <p className="is-size-6 mb-0">{asset.name}</p>
            <p className="is-size-6 mb-0 has-text-weight-bold">
              {prettyQuantity(balance)} {asset.ticker}
            </p>
          </div>
        </div>
        <div className="column is-2">
          <ProgressBar asset={asset} />
        </div>
        <div className="column is-2">
          <p className="has-text-weight-bold is-gradient">
            Available for Minting
          </p>
        </div>
        <div className="column is-5 has-text-right">
          {asset.isAvailable ? (
            <>
              <TradeButton />
              <FilterButton ticker={asset.ticker} />
            </>
          ) : (
            <p className="is-size-6 has-text-weight-bold has-text-right mr-3">
              Coming soon
            </p>
          )}
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
