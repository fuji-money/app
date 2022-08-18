import { useContext, useEffect, useState } from 'react'
import { WalletContext } from 'components/providers/wallet'
import { createFujiAccount, fujiAccountMissing } from 'lib/marina'
import { closeModal, openModal } from 'lib/utils'
import AccountModal from 'components/modals/account'

const ConnectButton = () => {
  const { connected, marina } = useContext(WalletContext)
  const [message, setMessage] = useState('')

  useEffect(() => {
    setMessage(connected ? 'Disconnect' : 'Connect wallet')
  }, [connected])

  const toggle = async () => {
    if (!marina) return
    if (connected) {
      await marina.disable()
    } else {
      await marina.enable()
      if (await fujiAccountMissing(marina)) {
        openModal('account-modal')
        await createFujiAccount(marina)
        closeModal('account-modal')
      }
    }
  }

  return (
    <>
      {marina && (
        <>
          <button onClick={toggle} className="button is-primary my-auto">
            {message}
          </button>
          <AccountModal />
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
