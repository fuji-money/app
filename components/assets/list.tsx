import { useContext, useEffect, useState } from 'react'
import { Asset } from 'lib/types'
import SomeError from 'components/layout/error'
import AssetRow from './row'
import Spinner from 'components/spinner'
import { ContractsContext } from 'components/providers/contracts'

const AssetsList = () => {
  const { loading, assets } = useContext(ContractsContext)

  const [filteredAssets, setFilteredAssets] = useState<Asset[]>()

  useEffect(() => {
    setFilteredAssets(assets.filter((asset: Asset) => asset.isSynthetic))
  }, [assets])

  if (loading) return <Spinner />
  if (!filteredAssets) return <SomeError>Error getting assets</SomeError>

  return (
    <div className="assets-list">
      {filteredAssets &&
        filteredAssets.map((asset: Asset, index: number) => (
          <AssetRow key={index} asset={asset} />
        ))}
    </div>
  )
}

export default AssetsList
