import { useContext } from 'react'
import { WalletContext } from 'components/providers'
import { bootstrapMarinaAccount, getMarina } from 'lib/marina'

const ConnectButton = () => {
  const { connect, disconnect, wallet } = useContext(WalletContext)

  const toggle = async () => {
    const marina = await getMarina()
    if (!marina) return
    if (wallet) {
      await marina.disable()
      disconnect()
    } else {
      await marina.enable()
      await bootstrapMarinaAccount(marina)
      connect()
    }
  }

  const message = wallet ? 'Disconnect' : 'Connect wallet'

  return (
    <button onClick={toggle} className="button is-primary my-auto">
      {message}
    </button>
  )
}

export default ConnectButton
