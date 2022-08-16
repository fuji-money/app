import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'
import {
  confirmContract,
  contractIsClosed,
  getContracts,
  liquidateContract,
} from 'lib/contracts'
import {
  getContractsFromStorage,
  getMyContractsFromStorage,
  updateContractOnStorage,
} from 'lib/storage'
import { Activity, Contract } from 'lib/types'
import { WalletContext } from './wallet'
import { getTransactions, getFujiCoins } from 'lib/marina'
import { NetworkString } from 'marina-provider'
import { getActivities } from 'lib/activities'

interface ContractsContextProps {
  activities: Activity[]
  contracts: Contract[]
  loading: boolean
  updateContracts: () => void
}

export const ContractsContext = createContext<ContractsContextProps>({
  activities: [],
  contracts: [],
  loading: true,
  updateContracts: () => {},
})

interface ContractsProviderProps {
  children: ReactNode
}
export const ContractsProvider = ({ children }: ContractsProviderProps) => {
  const [activities, setActivities] = useState<Activity[]>([])
  const [contracts, setContracts] = useState<Contract[]>([])
  const [loading, setLoading] = useState(true)
  const { connected, marina, network, xPubKey } = useContext(WalletContext)

  const updateContracts = async () => {
    setContracts(await getContracts())
    setActivities(await getActivities())
    setLoading(false)
  }

  // check for confirmed contracts while app was offline
  const checkUnconfirmedContracts = async () => {
    const transactions = await getTransactions()
    const hasTx = (txid = '') => transactions.some((tx) => tx.txId === txid)
    getMyContractsFromStorage(network, xPubKey)
      .filter((contract) => !contract.confirmed && hasTx(contract.txid))
      .map((contract) => confirmContract(contract))
  }

  // check for liquidated contracts while app was offline
  const checkLiquidatedContracts = async () => {
    const fujiCoins = await getFujiCoins()
    const hasCoin = (txid = '') => fujiCoins.some((coin) => coin.txid === txid)
    getMyContractsFromStorage(network, xPubKey)
      .filter(
        (contract) =>
          contract.confirmed &&
          !hasCoin(contract.txid) &&
          !contractIsClosed(contract),
      )
      .map((contract) => liquidateContract(contract))
  }

  // temporary fix: fix missing xPubKey on old contracts and store on local storage
  const fixMissingXPubKeyOnOldContracts = () => {
    getContractsFromStorage()
      .filter((contract) => !contract.xPubKey && contract.network === network)
      .map((contract) => {
        contract.xPubKey = xPubKey
        updateContractOnStorage(contract)
      })
  }

  const firstRender = useRef<NetworkString[]>([])

  useEffect(() => {
    if (network && xPubKey) {
      // run only on first render for each network
      if (!firstRender.current.includes(network)) {
        fixMissingXPubKeyOnOldContracts()
        checkUnconfirmedContracts()
        checkLiquidatedContracts()
        firstRender.current.push(network)
      }
    }
  })

  // update contracts
  useEffect(() => {
    if (connected && marina) {
      updateContracts()
      // on a new transaction received, check if it's a contract confirmation
      const newTxId = marina.on('NEW_TX', (tx) => {
        console.log('new tx', tx)
        const contract = getMyContractsFromStorage(network, xPubKey).find(
          (contract) => !contract.confirmed && contract.txid === tx.txId,
        )
        if (contract) {
          confirmContract(contract)
          updateContracts()
        }
      })
      // on a new spent utxo, check if it's a contract liquidation
      const spentUtxoId = marina.on('SPENT_UTXO', (utxo) => {
        console.log('new spent utxo', utxo)
        const contract = getMyContractsFromStorage(network, xPubKey).find(
          (contract) => contract.txid === utxo.txid && utxo.vout === 0,
        )
        if (contract) {
          liquidateContract(contract)
          updateContracts()
        }
      })
      return () => {
        marina.off(newTxId)
        marina.off(spentUtxoId)
      }
    }
  }, [connected, marina, network, xPubKey])

  return (
    <ContractsContext.Provider
      value={{ activities, contracts, loading, updateContracts }}
    >
      {children}
    </ContractsContext.Provider>
  )
}
