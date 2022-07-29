import { useContext, useEffect, useState } from 'react'
import { WalletContext } from 'components/providers/wallet'
import { createFujiAccount, getMarina, fujiAccountMissing } from 'lib/marina'
import { closeModal, openModal } from 'lib/utils'
import AccountModal from 'components/modals/account'
import { MarinaProvider } from 'marina-provider'

const ConnectButton = () => {
  const { connect, disconnect, wallet } = useContext(WalletContext)
  const [marina, setMarina] = useState<MarinaProvider>()

  useEffect(() => {
    const checkMarina = async () => setMarina(await getMarina())
    checkMarina()
  })

  const toggle = async () => {
    if (!marina) return
    if (wallet) {
      await marina.disable()
      disconnect()
    } else {
      if (!(await marina.isEnabled())) await marina.enable()
      if (await fujiAccountMissing(marina)) {
        openModal('account-modal')
        await createFujiAccount(marina)
        closeModal('account-modal')
      }
      connect()
    }
  }

  const message = wallet ? 'Disconnect' : 'Connect wallet'

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
