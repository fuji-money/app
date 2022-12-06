import { useContext, useEffect, useState } from 'react'
import { WalletContext } from 'components/providers/wallet'
import { createFujiAccount, fujiAccountMissing } from 'lib/marina'
import { closeModal, openModal } from 'lib/utils'
import AccountModal from 'components/modals/account'
import WalletsModal from 'components/modals/wallets'
import { ModalIds } from 'components/modals/modal'

const ConnectButton = () => {
  const { connected, marina, setConnected } = useContext(WalletContext)
  const [message, setMessage] = useState('')

  useEffect(() => {
    setMessage(connected ? 'Disconnect' : 'Connect wallet')
  }, [connected])

  const toggle = async () => {
    if (!marina) return
    if (connected) {
      await marina.disable()
      setConnected(false)
    } else {
      openModal(ModalIds.Wallets)
    }
  }

  const handleWalletChoice = async () => {
    closeModal(ModalIds.Wallets)
    if (!marina) return
    if (!(await marina.isEnabled())) await marina.enable()
    if (await fujiAccountMissing(marina)) {
      openModal(ModalIds.Account)
      await createFujiAccount(marina)
      closeModal(ModalIds.Account)
    }
  }

  return (
    <>
      {marina && (
        <>
          <button onClick={toggle} className="button is-primary my-auto mr-4">
            {message}
          </button>
          <AccountModal />
          <WalletsModal handleWalletChoice={handleWalletChoice} />
        </>
      )}
      {!marina && (
        <a
          href="https://vulpem.com/marina"
          target="_blank"
          rel="noreferrer"
          className="button is-primary my-auto"
        >
          Install Marina
        </a>
      )}
    </>
  )
}

export default ConnectButton
