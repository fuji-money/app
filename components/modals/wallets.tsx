import Image from 'next/image'
import Modal, { ModalIds } from './modal'
import { WalletType } from 'lib/wallet'
import { useContext } from 'react'
import { WalletContext } from 'components/providers/wallet'
import classNames from 'classnames'

interface WalletInfo {
  type: WalletType
  name: string
  icon: string
  desc: string
}

const wallets: WalletInfo[] = [
  {
    type: WalletType.Marina,
    name: 'Marina',
    icon: '/images/wallets/marina.svg',
    desc: 'Connect to Marina wallet to access Fuji Money directly from your browser',
  },
  {
    type: WalletType.Alby,
    name: 'Alby',
    icon: '/images/wallets/alby.svg',
    desc: 'Connect to Aqua wallet to access Fuji Money from your mobile device',
  },
]

const WalletButton = ({
  wallet,
  enabled,
}: {
  wallet: WalletInfo
  enabled?: boolean
}) => {
  const { name, icon, desc } = wallet
  return (
    <div className={classNames('box', { disabled: !enabled })}>
      <article className="media has-text-left">
        <div className="media-left">
          <figure className="image is-64x64">
            <Image
              src={icon}
              alt={`${name} wallet logo`}
              height={64}
              width={64}
            />
          </figure>
        </div>
        <div className="media-content">
          <div className="content">
            <p>
              <strong>{name}</strong>
              <br />
              {desc}
            </p>
          </div>
        </div>
      </article>
      <style jsx>{`
        div.box {
          background-color: white;
          border: 1px solid #6b1d9c;
          display: flex;
          margin: 1rem 5rem;
          padding: 1rem;
        }
        .disabled {
          opacity: 0.4 !important;
        }
      `}</style>
    </div>
  )
}

interface WalletsModalProps {
  handleWalletChoice: (type: WalletType) => void
}

const WalletsModal = ({ handleWalletChoice }: WalletsModalProps) => {
  const { installedWallets } = useContext(WalletContext)
  const installedWalletTypes = installedWallets.map((wallet) => wallet.type)

  const buttons = wallets.map((wallet, index) => {
    const enabled =
      installedWalletTypes.includes(wallet.type) &&
      !installedWallets.find((w) => w.type === wallet.type)?.isConnected()

    return enabled ? (
      <a key={index} onClick={() => handleWalletChoice(wallet.type)}>
        <WalletButton wallet={wallet} enabled />
      </a>
    ) : (
      <div key={index}>
        <WalletButton wallet={wallet} />
      </div>
    )
  })
  return (
    <Modal id={ModalIds.Wallets}>
      <h3 className="mb-5">Connect wallet</h3>
      {buttons}
    </Modal>
  )
}

export default WalletsModal
