import Image from 'next/image'
import { saveAs } from 'file-saver'
import { localStorageBoltzKeysKey, localStorageContractsKey } from 'lib/storage'

const downloadFile = (localStorageKey: string, fileName: string) => {
  const item = localStorage.getItem(localStorageKey)
  if (!item) return
  const prettyJSON = JSON.stringify(JSON.parse(item), null, 2)
  const blob = new Blob([prettyJSON], { type: 'application/json' })
  saveAs(blob, fileName)
}

const Settings = () => {
  const handleContractsBackup = () =>
    downloadFile(localStorageContractsKey, 'contracts.json')

  const handleSwapsBackup = () =>
    downloadFile(localStorageBoltzKeysKey, 'swaps.json')

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
          <div className="dropdown-item">
            <p>
              <button className="button" onClick={handleContractsBackup}>
                Backup contracts
              </button>
            </p>
          </div>
          <div className="dropdown-item">
            <p>
              <button className="button" onClick={handleSwapsBackup}>
                Backup swaps
              </button>
            </p>
          </div>
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
