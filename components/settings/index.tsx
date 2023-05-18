import Image from 'next/image'
import { saveAs } from 'file-saver'
import { localStorageSwapsKey, localStorageContractsKey } from 'lib/storage'
import { useContext } from 'react'
import { WeblnContext } from 'components/providers/webln'
import { LightningEnabledTasks, Tasks } from 'lib/tasks'

const downloadFile = (localStorageKey: string, fileName: string) => {
  const item = localStorage.getItem(localStorageKey)
  if (!item) return
  const prettyJSON = JSON.stringify(JSON.parse(item), null, 2)
  const blob = new Blob([prettyJSON], { type: 'application/json' })
  saveAs(blob, fileName)
}

const Item = ({
  disabled,
  handler,
  text,
}: {
  disabled?: boolean
  handler: () => void
  text: string
}) => {
  const title = disabled ? 'Reload to re-enable button' : undefined
  return (
    <div className="dropdown-item">
      <p>
        <button
          className="button"
          onClick={handler}
          disabled={disabled}
          title={title}
        >
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
  const { weblnIsEnabled, weblnCanEnable, weblnProvider, weblnEnableHandler } =
    useContext(WeblnContext)

  const handleContractsBackup = () =>
    downloadFile(localStorageContractsKey, 'contracts.json')

  const handleSwapsBackup = () =>
    downloadFile(localStorageSwapsKey, 'swaps.json')

  const showEnableWeblnButton =
    weblnProvider && !weblnIsEnabled && weblnEnableHandler

  const showBackupSwapsButton =
    Object.keys(LightningEnabledTasks).filter(
      (task) => LightningEnabledTasks[task] === true,
    ).length > 0

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
          {showBackupSwapsButton && (
            <Item handler={handleSwapsBackup} text="Backup swaps" />
          )}
          {showEnableWeblnButton && (
            <Item
              handler={weblnEnableHandler}
              text="Enable WebLN"
              disabled={!weblnCanEnable}
            />
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
