import Image from 'next/image'
import Modal, { ModalIds } from './modal'
import { WalletType } from 'lib/wallet'
import classNames from 'classnames'
import { NetworkString } from 'marina-provider'

interface WalletInfo {
  name: string
  icon: string
  desc: string
  link: string
}

const walletsInfos: Record<WalletType, WalletInfo> = {
  [WalletType.Marina]: {
    name: 'Marina',
    icon: '/images/wallets/marina.svg',
    desc: 'Connect to Marina to access Fuji Money from your marina browser extension',
    link: 'https://vulpem.com/marina',
  },
  [WalletType.Alby]: {
    name: 'Alby',
    icon: '/images/wallets/alby.svg',
    desc: 'Connect to Alby wallet to access Fuji Money from your alby liquid account',
    link: 'https://getalby.com/',
  },
}

const WalletButton = ({
  wallet,
  installed,
  isConnected,
  network,
}: {
  wallet: WalletInfo
  installed?: boolean
  isConnected?: boolean
  network?: string
}) => {
  const { name, icon, desc } = wallet
  return (
    <div>
      <div className={classNames('box', { disabled: !installed })}>
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
              <div>
                <div className="is-flex is-justify-content-space-between is-align-content-center mb-1">
                  <span>
                    <strong>{name}</strong>
                  </span>

                  <div>
                    {installed && network && (
                      <span className="tag is-info">{network}</span>
                    )}
                    {installed && isConnected && (
                      <span className="tag is-success ml-1">
                        Connected <i className="ml-1 fa-solid fa-check"></i>
                      </span>
                    )}
                  </div>
                </div>
                <p>{desc}</p>
              </div>
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
      {!installed && (
        <p>
          <a
            className="is-primary"
            href={wallet.link}
            target="_blank"
            rel="noopener noreferrer"
          >
            <i className="mr-1 fa-solid fa-link"></i>
            <strong>Download {name} </strong>
          </a>
        </p>
      )}
    </div>
  )
}

export interface WalletsModalProps {
  handleWalletChoice: (type: WalletType) => void
  wallets: {
    type: WalletType
    installed: boolean
    connected: boolean
    network?: NetworkString
  }[]
}

const WalletsModal = ({ handleWalletChoice, wallets }: WalletsModalProps) => {
  const buttons = wallets.map(
    ({ type, connected, installed, network }, index) => {
      return (
        <div
          key={index}
          onClick={
            installed && !connected ? () => handleWalletChoice(type) : undefined
          }
        >
          <WalletButton
            wallet={walletsInfos[type]}
            installed={installed}
            isConnected={connected}
            network={network}
          />
        </div>
      )
    },
  )
  return (
    <Modal id={ModalIds.Wallets}>
      <h3 className="mb-5">Connect wallet</h3>
      {buttons}
    </Modal>
  )
}

export default WalletsModal
