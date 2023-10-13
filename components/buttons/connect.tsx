import React, { useCallback, useContext, useEffect, useState } from 'react'
import { WalletContext } from 'components/providers/wallet'
import { closeModal, openModal } from 'lib/utils'
import AccountModal from 'components/modals/account'
import WalletsModal, { WalletsModalProps } from 'components/modals/wallets'
import { ModalIds } from 'components/modals/modal'
import { WalletType } from 'lib/wallet'

const ConnectButton: React.FC = () => {
  const { installedWallets, connect, initializing } = useContext(WalletContext)
  const [wallets, setWallets] = useState<WalletsModalProps['wallets']>([])

  const updateFn =
    (update: WalletsModalProps['wallets'][number]) =>
    (prevWallets: WalletsModalProps['wallets']) =>
      [...prevWallets.filter((w) => w.type !== update.type), update]

  const updateWallet = useCallback(
    async (type: WalletType) => {
      const wallet = installedWallets.find((w) => w.type === type)
      if (!wallet) {
        setWallets(updateFn({ type, installed: false, connected: false }))
        return
      }
      const isConnected = wallet.isConnected()
      if (!isConnected) {
        setWallets(updateFn({ type, installed: true, connected: false }))
        return
      }

      const network = await wallet.getNetwork()
      setWallets(updateFn({ type, installed: true, connected: true, network }))
    },
    [installedWallets],
  )

  const handleWalletChoice = async (type: WalletType) => {
    closeModal(ModalIds.Wallets)
    if (type) await connect(type)
    await updateWallet(type)
  }

  useEffect(() => {
    async function updateWallets() {
      await Promise.all([WalletType.Marina, WalletType.Alby].map(updateWallet))
    }

    updateWallets()
  }, [installedWallets, updateWallet])

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
          handleWalletChoice={handleWalletChoice}
          wallets={wallets}
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
