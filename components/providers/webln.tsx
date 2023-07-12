import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'
import { VoidOrUndefFunc } from 'lib/types'
import { closeModal, openModal } from 'lib/utils'
import { ModalIds } from 'components/modals/modal'
import { WalletContext } from './wallet'

interface WeblnContextProps {
  weblnIsEnabled: boolean
  weblnEnableHandler: VoidOrUndefFunc
  weblnCanEnable: boolean
  weblnProvider: any
  weblnProviderName: string
}

export const WeblnContext = createContext<WeblnContextProps>({
  weblnEnableHandler: undefined,
  weblnIsEnabled: false,
  weblnCanEnable: true,
  weblnProvider: undefined,
  weblnProviderName: '',
})

interface WeblnProviderProps {
  children: ReactNode
}
export const WeblnProvider = ({ children }: WeblnProviderProps) => {
  const { wallet } = useContext(WalletContext)

  const [weblnCanEnable, setWeblnCanEnable] = useState(true)
  const [weblnIsEnabled, setweblnIsEnabled] = useState(false)
  const [weblnProvider, setWeblnProvider] = useState<any>()
  const [weblnProviderName, setWeblnProviderName] = useState('')

  const alreadyAsk = useRef(true) // TODO

  // asks Alby for permission
  const weblnEnableHandler = () => {
    try {
      if (weblnProvider) {
        // if user cancels authorization or closes pronpt, he will
        // not be able to request it again, only after a full reload
        setWeblnCanEnable(false)
        // ask user to authorization
        weblnProvider.enable().then(() => {
          weblnProvider.getInfo().then((info: any) => {
            if (info.node?.alias?.includes('getalby.com'))
              setWeblnProviderName('Alby')
          })
        })
      }
    } catch (ignore) {}
    closeModal(ModalIds.Webln)
  }

  // if webln support detected, asks user to enable it
  useEffect(() => {
    if (window.webln && wallet) {
      setWeblnProvider(window.webln)
      if (window.webln.enabled) setweblnIsEnabled(true)
      else if (!alreadyAsk.current) {
        openModal(ModalIds.Webln)
        alreadyAsk.current = true
      }
    }
  }, [wallet])

  return (
    <WeblnContext.Provider
      value={{
        weblnIsEnabled,
        weblnEnableHandler,
        weblnCanEnable,
        weblnProvider,
        weblnProviderName,
      }}
    >
      {children}
    </WeblnContext.Provider>
  )
}
