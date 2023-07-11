import { useContext } from 'react'
import { WalletContext } from 'components/providers/wallet'
import { WalletType } from 'lib/wallet'
import DropDown from 'components/dropdown'

const ConnectButton = () => {
  const { wallet, selectWallet, wallets } = useContext(WalletContext)

  const toggleWallet = async (type: WalletType) => {
    if (!type) return
    // disconnect if already connected
    if (wallet?.type === type) {
      if (wallet?.isConnected()) {
        await wallet.disconnect()
      }
      return
    }

    // select the new wallet and connect it
    await selectWallet(type)
    await wallet?.connect()
  }

  return (
    <>
      {wallets?.length && (
        <>
          <DropDown 
            title={wallet?.isConnected() ? wallet?.type : 'Connect'}
            options={wallets.map((w) => ({
              value: wallet?.type === w.type ? 'Disconnect ' + wallet?.type  : w.type,
              onClick: () => toggleWallet(w.type),
            }))}
          />
        </>
      )}
      {!wallets.length && (
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
