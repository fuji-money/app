import { useContext, useEffect, useState } from 'react'
import { Asset } from 'lib/types'
import SomeError from 'components/layout/error'
import AssetRow from './row'
import Spinner from 'components/spinner'
import { ConfigContext } from 'components/providers/config'
import { WalletContext } from 'components/providers/wallet'
import { getAssetBalance } from 'lib/marina'

const AssetsList = () => {
  const { config, loading } = useContext(ConfigContext)
  const { wallets, balances } = useContext(WalletContext)

  const [totalBalance, setTotalBalance] = useState<Record<string, number>>({})

  useEffect(() => {
    for (const asset of config.assets) {
      let total = 0
      for (const wallet of wallets) {
        total += getAssetBalance(asset, balances[wallet.type])
      }
      setTotalBalance((prev) => ({ ...prev, [asset.id]: total }))
    }
  }, [balances, config.assets, wallets])

  const [filteredAssets, setFilteredAssets] = useState<Asset[]>()

  useEffect(() => {
    setFilteredAssets(config.assets.filter((asset: Asset) => asset.isSynthetic))
  }, [config.assets])

  if (loading) return <Spinner />
  if (!filteredAssets) return <SomeError>Error getting assets</SomeError>

  return (
    <div className="assets-list">
      {filteredAssets &&
        filteredAssets.map((asset: Asset, index: number) => (
          <AssetRow
            key={index}
            asset={asset}
            balance={totalBalance[asset.id]}
          />
        ))}
    </div>
  )
}

export default AssetsList
