import Image from 'next/image'
import { saveAs } from 'file-saver'
import { localStorageContractsKey } from 'lib/storage'

const Settings = () => {
  const handleBackup = () => {
    const contracts = localStorage.getItem(localStorageContractsKey) ?? '[]'
    const prettyJSON = JSON.stringify(JSON.parse(contracts), null, 2)
    const blob = new Blob([prettyJSON], { type: 'application/json' })
    saveAs(blob, 'contracts.json')
  }
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
              <button className="button" onClick={handleBackup}>
                Backup contracts
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
      `}</style>
    </div>
  )
}

export default Settings
