import { useContext } from 'react'
import { WalletContext } from 'components/providers/wallet'
import { closeModal, openModal } from 'lib/utils'
import AccountModal from 'components/modals/account'
import WalletsModal from 'components/modals/wallets'
import { ModalIds } from 'components/modals/modal'
import { WalletType } from 'lib/wallet'

const ConnectButton = () => {
  const { installedWallets, connect } = useContext(WalletContext)

  const handleWalletChoice = async (type: WalletType) => {
    closeModal(ModalIds.Wallets)
    if (type) await connect(type)
  }

  return (
    <>
      {installedWallets.length ? (
        <>
          <button
            onClick={() => openModal(ModalIds.Wallets)}
            className="button is-primary my-auto mr-4"
          >
            Connect
          </button>
          <AccountModal />
          <WalletsModal handleWalletChoice={handleWalletChoice} />
        </>
      ) : (
        <a
          href="https://vulpem.com/marina"
          target="_blank"
          rel="noreferrer"
          className="button is-primary my-auto"
        >
          Install Marina or Alby
        </a>
      )}
    </>
  )
}

export default ConnectButton
