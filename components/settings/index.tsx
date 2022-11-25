import Image from 'next/image'
import { saveAs } from 'file-saver'
import { localStorageSwapsKey, localStorageContractsKey } from 'lib/storage'
import { useContext } from 'react'
import { WalletContext } from 'components/providers/wallet'

const downloadFile = (localStorageKey: string, fileName: string) => {
  const item = localStorage.getItem(localStorageKey)
  if (!item) return
  const prettyJSON = JSON.stringify(JSON.parse(item), null, 2)
  const blob = new Blob([prettyJSON], { type: 'application/json' })
  saveAs(blob, fileName)
}

const Item = ({ handler, text }: { handler: () => void; text: string }) => {
  return (
    <div className="dropdown-item">
      <p>
        <button className="button" onClick={handler}>
          {text}
        </button>
      </p>
      <style jsx>{`
        .button {
          width: 100%;
        }
      `}</style>
    </div>
  )
}

const Settings = () => {
  const { weblnProvider, enableWeblnHandler } = useContext(WalletContext)

  const handleContractsBackup = () =>
    downloadFile(localStorageContractsKey, 'contracts.json')

  const handleSwapsBackup = () =>
    downloadFile(localStorageSwapsKey, 'swaps.json')

  const showEnableWeblnButton =
    window.webln && !weblnProvider && enableWeblnHandler

  return (
    <div className="dropdown is-hoverable my-auto pt-2">
      <div className="dropdown-trigger p-2">
        <p>
          <Image
            src="/images/icons/gear.svg"
            alt="settings"
            height={20}
            width={20}
          />
        </p>
      </div>
      <div className="dropdown-menu">
        <div className="dropdown-content">
          <Item handler={handleContractsBackup} text="Backup contracts" />
          <Item handler={handleSwapsBackup} text="Backup swaps" />
          {showEnableWeblnButton && (
            <Item handler={enableWeblnHandler} text="Enable WebLN" />
          )}
        </div>
      </div>
      <style jsx>{`
        .dropdown-menu {
          left: -180px;
        }
        p {
          line-height: 20px;
        }
        .dropdown:hover {
          background-color: #ffede3;
        }
        .button {
          width: 100%;
        }
      `}</style>
    </div>
  )
}

export default Settings
