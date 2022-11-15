import Image from 'next/image'
import Modal, { ModalIds } from './modal'

interface WalletInfo {
  name: string
  icon: string
  desc: string
  enabled?: boolean
}

const wallets: WalletInfo[] = [
  {
    name: 'Marina',
    icon: '/images/wallets/marina.svg',
    desc: 'Connect to Marina wallet to access Fuji Money directly from your browser',
    enabled: true,
  },
  {
    name: 'Aqua (soon)',
    icon: '/images/wallets/aqua.svg',
    desc: 'Connect to Aqua wallet to access Fuji Money from your mobile device',
  },
  {
    name: 'Jade (soon)',
    icon: '/images/wallets/jade.svg',
    desc: 'Connect to your Jade wallet to access Fuji Money from secure hardware.',
  },
  {
    name: 'Ledger (soon)',
    icon: '/images/wallets/ledger.svg',
    desc: 'Connect to your Ledger wallet to safely access Fuji Money.',
  },
]

const WalletButton = ({ wallet }: { wallet: WalletInfo }) => {
  const { name, icon, desc, enabled } = wallet
  return (
    <div className={`${enabled ? '' : 'disabled'} box`}>
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
  handleWalletChoice: (name: string) => void
}

const WalletsModal = ({ handleWalletChoice }: WalletsModalProps) => {
  const buttons = wallets.map((wallet, index) => {
    return wallet.enabled ? (
      <a key={index} onClick={() => handleWalletChoice(wallet.name)}>
        <WalletButton wallet={wallet} />
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
