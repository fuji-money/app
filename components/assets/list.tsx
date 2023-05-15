import { useContext, useEffect, useRef, useState } from 'react'
import { fetchAssets } from 'lib/api'
import { Asset } from 'lib/types'
import SomeError from 'components/layout/error'
import AssetRow from './row'
import Spinner from 'components/spinner'
import { WalletContext } from 'components/providers/wallet'
import { NetworkString } from 'marina-provider'
import { sleep } from 'lib/utils'

const AssetsList = () => {
  const [loading, setLoading] = useState(true)
  const { network } = useContext(WalletContext)

  const assetsByNetwork = useRef<Record<string, Asset[]>>({})

  const onlySynth = (asset: Asset) => asset.isSynthetic

  useEffect(() => {
    if (!assetsByNetwork.current[network]) {
      setLoading(true)
      fetchAssets(network).then((data) => {
        assetsByNetwork.current[network] = data.filter(onlySynth)
        setLoading(false)
      })
    }
  }, [network])

  const assets = assetsByNetwork.current[network]

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
