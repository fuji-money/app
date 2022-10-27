import { useContext, useEffect, useState } from 'react'
import { fetchAssets } from 'lib/api'
import { Asset } from 'lib/types'
import SomeError from 'components/layout/error'
import AssetRow from './row'
import Spinner from 'components/spinner'
import { WalletContext } from 'components/providers/wallet'

const AssetsList = () => {
  const [assets, setAssets] = useState<Asset[]>()
  const [loading, setLoading] = useState(true)
  const { network } = useContext(WalletContext)

  useEffect(() => {
    const onlySynth = (asset: Asset) => asset.isSynthetic
    fetchAssets().then((data) => {
      setAssets(data.filter(onlySynth))
      setLoading(false)
    })
  }, [network])

  if (loading) return <Spinner />
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
