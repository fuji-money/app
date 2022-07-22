import { useContext, useEffect, useState } from 'react'
import { fetchAssets } from 'lib/api'
import { Asset } from 'lib/types'
import SomeError from 'components/layout/error'
import AssetRow from './row'
import Spinner from 'components/spinner'
import { NetworkContext } from 'components/providers/network'

const AssetsList = () => {
  const [assets, setAssets] = useState<Asset[]>()
  const [isLoading, setLoading] = useState(false)
  const { network } = useContext(NetworkContext)

  useEffect(() => {
    const onlySynth = (asset: Asset) => asset.isSynthetic
    setLoading(true)
    fetchAssets().then((data) => {
      setAssets(data.filter(onlySynth))
      setLoading(false)
    })
  }, [network])

  if (isLoading) return <Spinner />
  if (!assets) return <SomeError>Error getting assets</SomeError>

  return (
    <div className="assets-list">
      {assets &&
        assets.map((asset: Asset, index: number) => (
          <AssetRow key={index} asset={asset} />
        ))}
    </div>
  )
}

export default AssetsList
