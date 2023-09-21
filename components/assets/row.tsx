import { prettyQuantity } from 'lib/pretty'
import Image from 'next/image'
import { Asset } from 'lib/types'
import FilterButton from 'components/buttons/filter'
import TradeButton from 'components/buttons/trade'
import { useContext } from 'react'
import { WalletContext } from 'components/providers/wallet'
import { getAssetBalance } from 'lib/marina'
import ProgressBar from 'components/progress'
import LeftToMint from 'components/progress/leftToMint'

interface AssetRowProps {
  asset: Asset
}

const AssetRow = ({ asset }: AssetRowProps) => {
  const { balances } = useContext(WalletContext)
  const balance = getAssetBalance(asset, balances)
  const disabled = !(asset.isAvailable && asset.id)

  return (
    <div className={`is-box has-pink-border row ${disabled && `disabled`}`}>
      <div className="columns level">
        <div className="column is-flex is-3">
          <div className="pr-4">
            <Image alt="asset logo" height={60} src={asset.icon} width={40} />
          </div>
          <div className="is-purple my-auto">
            <p className="is-size-6 mb-0">{asset.name}</p>
            <p className="is-size-6 mb-0 has-text-weight-bold">
              {prettyQuantity(balance, asset.precision)} {asset.ticker}
            </p>
          </div>
        </div>
        <div className="column is-4">
          {asset.maxCirculatingSupply ? <ProgressBar asset={asset} /> : ''}
        </div>
        <div className="column is-1">
          {asset.maxCirculatingSupply ? <LeftToMint asset={asset} /> : ''}
        </div>
        <div className="column is-4 has-text-right">
          {disabled ? (
            <p className="is-size-6 has-text-weight-bold has-text-right mr-3">
              Coming soon
            </p>
          ) : (
            <>
              <TradeButton hash={asset.id} />
              <FilterButton ticker={asset.ticker} />
            </>
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
