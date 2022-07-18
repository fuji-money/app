import { useContext } from 'react'
import { WalletContext } from 'components/providers'
import { createFujiAccount, getMarina, fujiAccountMissing } from 'lib/marina'
import { closeModal, openModal } from 'lib/utils'
import AccountModal from 'components/modals/account'

const ConnectButton = () => {
  const { connect, disconnect, wallet } = useContext(WalletContext)

  const toggle = async () => {
    const marina = await getMarina()
    if (!marina) return
    if (wallet) {
      await marina.disable()
      disconnect()
    } else {
      if (!await marina.isEnabled()) await marina.enable()
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
      <button onClick={toggle} className="button is-primary my-auto">
        {message}
      </button>
      <AccountModal />
    </>
  )
}

export default ConnectButton
