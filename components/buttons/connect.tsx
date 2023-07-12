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
    <div className="my-auto">
      {!!wallets?.length && (
        <>
          <DropDown
            title={wallet?.isConnected() ? wallet?.type : 'Connect wallet'}
            options={wallets.map((w) => ({
              isActive: wallet?.type === w.type,
              value: w.type,
              icon:
                w.type === WalletType.Marina
                  ? '/images/wallets/marina.svg'
                  : '/images/wallets/alby.svg',
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
          className="button is-primary"
        >
          Install Marina or Alby
        </a>
      )}
    </div>
  )
}

export default ConnectButton
