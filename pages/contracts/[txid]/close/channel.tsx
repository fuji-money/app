import type { NextPage } from 'next'
import { useRouter } from 'next/router'
import { useContext, useEffect, useState } from 'react'
import SomeError from 'components/layout/error'
import Spinner from 'components/spinner'
import { getContract } from 'lib/contracts'
import { EnabledTasks, Tasks } from 'lib/tasks'
import { ContractsContext } from 'components/providers/contracts'
import Channel from 'components/channel'
import NotAllowed from 'components/messages/notAllowed'
import { WalletContext } from 'components/providers/wallet'
import { ConfigContext } from 'components/providers/config'
import { fUSDAssetId } from 'lib/constants'
import { networks } from 'liquidjs-lib'

const ContractRedeemChannel: NextPage = () => {
  const { wallet } = useContext(WalletContext)
  const { config } = useContext(ConfigContext)
  const { newContract, setNewContract } = useContext(ContractsContext)
  const [isLoading, setIsLoading] = useState(true)

  const { assets } = config
  const synthetic = assets.find((asset) => asset.id === fUSDAssetId)

  const router = useRouter()
  const { txid } = router.query

  useEffect(() => {
    const setContract = async () => {
      if (!wallet) return
      if (typeof txid !== 'string') return
      const network = await wallet.getNetwork()
      const collateral = assets.find(
        (asset) => asset.id === networks[network].assetHash,
      )
      if (synthetic && collateral) {
        const contract = await getContract(txid, wallet, synthetic, collateral)
        if (contract) setNewContract(contract)
      }
    }

    setContract().finally(() => setIsLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [txid])

  if (!EnabledTasks[Tasks.Redeem]) return <NotAllowed />
  if (isLoading) return <Spinner />
  if (!newContract) return <SomeError>Contract not found</SomeError>

  return <Channel contract={newContract} task={Tasks.Redeem} />
}

export default ContractRedeemChannel
