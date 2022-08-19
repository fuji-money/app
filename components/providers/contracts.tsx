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
  getContracts,
  liquidateContract,
  reopenContract,
} from 'lib/contracts'
import {
  getContractsFromStorage,
  getMyContractsFromStorage,
  updateContractOnStorage,
} from 'lib/storage'
import { Activity, Contract, ContractState } from 'lib/types'
import { WalletContext } from './wallet'
import { getTransactions, getFujiCoins } from 'lib/marina'
import { NetworkString } from 'marina-provider'
import { getActivities } from 'lib/activities'
import { marinaFujiAccountID } from 'lib/constants'
import { openModal } from 'lib/utils'

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

  // update state (contracts, activities) with last changes on storage
  // setLoading(false) is there only to remove spinner on first render
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
  // - if fuji has the coin <txid>:0, it means the contract is active
  // - if no coin, and contract not redeemed, it should be liquidated
  const checkLiquidatedContracts = async () => {
    const fujiCoins = await getFujiCoins()
    const hasCoin = (txid = '') => fujiCoins.some((coin) => coin.txid === txid)
    getMyContractsFromStorage(network, xPubKey)
      .filter(
        (contract) =>
          contract.confirmed && contract.state !== ContractState.Redeemed,
      )
      .map((contract) =>
        hasCoin(contract.txid)
          ? reopenContract(contract)
          : liquidateContract(contract),
      )
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

  // on the listener for new tx for fuji account check:
  // - if it's a known contract, confirm it
  // - if not, is possible to be a liquidation
  const onNewTxListener = () => {
    if (marina) {
      marina.on('NEW_TX', ({ accountID, data }) => {
        if (accountID === marinaFujiAccountID) {
          const tx = data
          console.log(`new tx ${new Date()}`, tx)
          const contract = getMyContractsFromStorage(network, xPubKey).find(
            (contract) => contract.txid === tx.txId,
          )
          if (contract && !contract.confirmed) {
            confirmContract(contract)
            return updateContracts()
          }
          if (!contract) {
            checkLiquidatedContracts()
            updateContracts()
          }
        }
      })
    }
  }

  const firstRender = useRef<NetworkString[]>([])

  useEffect(() => {
    if (network && xPubKey) {
      // run only on first render for each network
      if (!firstRender.current.includes(network)) {
        checkLiquidatedContracts()
        checkUnconfirmedContracts()
        fixMissingXPubKeyOnOldContracts()
        onNewTxListener()
        firstRender.current.push(network)
      }
    }
  })

  // update contracts
  useEffect(() => {
    if (connected && marina) updateContracts()
  }, [connected, marina, network, xPubKey])

  return (
    <ContractsContext.Provider
      value={{ activities, contracts, loading, updateContracts }}
    >
      {children}
    </ContractsContext.Provider>
  )
}
