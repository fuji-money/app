import React, { useCallback, useContext, useEffect, useState } from 'react'
import { WalletContext } from 'components/providers/wallet'
import { closeModal, openModal } from 'lib/utils'
import AccountModal from 'components/modals/account'
import WalletsModal from 'components/modals/wallets'
import { ModalIds } from 'components/modals/modal'
import { WalletType } from 'lib/wallet'
import { NetworkString } from 'marina-provider'

const ConnectButton: React.FC = () => {
  const { installedWallets, connect, initializing } = useContext(WalletContext)

  const [walletNetworks, setWalletNetworks] = useState<{
    [walletType: string]: NetworkString
  }>({})
  const getWalletNetwork = useCallback(
    (type: WalletType) => walletNetworks[type],
    [walletNetworks],
  )

  const handleWalletChoice = async (type: WalletType) => {
    closeModal(ModalIds.Wallets)
    if (type) await connect(type)
  }

  useEffect(() => {
    if (installedWallets) {
      const set = async () => {
        const walletsNetworks = await Promise.allSettled(
          (installedWallets || []).map((w) =>
            w.isConnected() ? w.getNetwork() : Promise.resolve(undefined),
          ),
        )

        setWalletNetworks(
          walletsNetworks.reduce((acc, walletNetwork, index) => {
            const wallet = installedWallets?.[index]
            if (!wallet) return acc
            return {
              ...acc,
              [wallet.type]:
                walletNetwork.status === 'fulfilled'
                  ? walletNetwork.value
                  : undefined,
            }
          }, {}),
        )
      }

      set().catch(console.error)
    } else {
      setWalletNetworks({})
    }
  }, [installedWallets])

  if (!initializing)
    return (
      <>
        <button
          onClick={() => openModal(ModalIds.Wallets)}
          className="button is-primary my-auto mr-4"
        >
          Connect
        </button>
        <AccountModal />
        <WalletsModal
          getWalletNetwork={getWalletNetwork}
          installedWallets={installedWallets}
          handleWalletChoice={handleWalletChoice}
        />
      </>
    )

  return (
    <>
      <button className="button is-primary my-auto mr-4" disabled>
        Loading...
      </button>
    </>
  )
}

export default ConnectButton
