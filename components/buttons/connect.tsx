import { useContext } from 'react'
import { WalletContext } from 'components/providers'
import { getMarina } from 'lib/marina'
import { marinaAccountID } from 'lib/constants'
import { synthAssetArtifact} from 'lib/artifacts'
import { MarinaProvider } from 'marina-provider'

const ConnectButton = () => {
  const { connect, disconnect, wallet } = useContext(WalletContext)

  const bootstrapMarinaAccount = async (marina: MarinaProvider) => {
    // create account 'fuji' on marina if doesn't exists
    try {
      await marina.getAccountInfo(marinaAccountID)
    } catch {
      await marina.createAccount(marinaAccountID)
    }
    // select 'fuji' account from marina
    await marina.useAccount(marinaAccountID)
    // import template (will throw error if already imported)
    try {
      await marina.importTemplate({
        type: 'ionio-artifact',
        template: JSON.stringify(synthAssetArtifact),
      })
    } catch {}
  }

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
