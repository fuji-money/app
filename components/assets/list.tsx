import { useContext, useEffect, useState } from 'react'
import { Asset } from 'lib/types'
import SomeError from 'components/layout/error'
import AssetRow from './row'
import Spinner from 'components/spinner'
import { ConfigContext } from 'components/providers/config'
import { WalletContext } from 'components/providers/wallet'
import { useSelectBalances } from 'lib/hooks'
import { getAssetBalance } from 'lib/marina'

const AssetsList = () => {
  const { config, loading } = useContext(ConfigContext)
  const { wallet } = useContext(WalletContext)
  const balances = useSelectBalances(wallet)

  const [filteredAssets, setFilteredAssets] = useState<Asset[]>()

  const { assets } = config

  useEffect(() => {
    setFilteredAssets(assets.filter((asset: Asset) => asset.isSynthetic))
  }, [assets])

  if (loading) return <Spinner />
  if (!filteredAssets) return <SomeError>Error getting assets</SomeError>

  return (
    <div className="assets-list">
      {filteredAssets &&
        filteredAssets.map((asset: Asset, index: number) => (
          <AssetRow
            key={index}
            asset={asset}
            balance={getAssetBalance(asset, balances)}
          />
        ))}
    </div>
  )
}

export default AssetsList
