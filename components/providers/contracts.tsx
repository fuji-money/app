import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'
import {
  getContracts,
  markContractLiquidated,
  markContractRedeemed,
  markContractOpen,
  markContractUnknown,
  markContractConfirmed,
  markContractTopup,
  contractIsClosed,
  getContractCovenantAddress,
  checkContractOutspend,
  createNewContract,
} from 'lib/contracts'
import { getContractsFromStorage, getMyContractsFromStorage } from 'lib/storage'
import { Activity, Contract, ContractState } from 'lib/types'
import { WalletContext } from './wallet'
import { isIonioScriptDetails, NetworkString, Utxo } from 'marina-provider'
import { getActivities } from 'lib/activities'
import { getFuncNameFromScriptHexOfLeaf } from 'lib/covenant'
import { getContractsFromMarina, getFujiCoins } from 'lib/marina'
import { marinaFujiAccountID } from 'lib/constants'
import { hex64LEToNumber } from 'lib/utils'
import { address } from 'liquidjs-lib'
import { ConfigContext } from './config'
import { Artifact } from '@ionio-lang/ionio'

interface ContractsContextProps {
  activities: Activity[]
  contracts: Contract[]
  loading: boolean
  newContract: Contract | undefined
  oldContract: Contract | undefined
  reloadContracts: () => void
  resetContracts: () => void
  setLoading: (arg0: boolean) => void
  setNewContract: (arg0: Contract) => void
  setOldContract: (arg0: Contract) => void
}

export const ContractsContext = createContext<ContractsContextProps>({
  activities: [],
  contracts: [],
  loading: true,
  newContract: undefined,
  oldContract: undefined,
  reloadContracts: () => {},
  resetContracts: () => {},
  setLoading: () => {},
  setNewContract: () => {},
  setOldContract: () => {},
})

interface ContractsProviderProps {
  children: ReactNode
}

export const ContractsProvider = ({ children }: ContractsProviderProps) => {
  const { chainSource, connected, marina, network, xPubKey } =
    useContext(WalletContext)
  const { artifactRepo, config, reloadConfig } = useContext(ConfigContext)

  const [activities, setActivities] = useState<Activity[]>([])
  const [contracts, setContracts] = useState<Contract[]>([])
  const [loading, setLoading] = useState(true)
  const [newContract, setNewContract] = useState<Contract>()
  const [oldContract, setOldContract] = useState<Contract>()

  const { assets } = config

  // save first time app was run
  const lastReload = useRef(Date.now())

  const reloadAndMarkLastReload = () => {
    lastReload.current = Date.now()
    reloadContracts()
    reloadConfig()
  }

  const resetContracts = () => {
    setNewContract(undefined)
    setOldContract(undefined)
  }

  // update state (contracts, activities) with last changes on storage
  // setLoading(false) is there only to remove spinner on first render
  const reloadContracts = async () => {
    if (connected && network) {
      await checkContractsStatus()
      setContracts(await getContracts(assets, network))
      setActivities(await getActivities())
      setLoading(false)
    }
  }

  // check if a contract is confirmed by its transaction history
  // https://electrumx.readthedocs.io/en/latest/protocol-methods.html#blockchain-scripthash-get-history
  // In summary:
  //   unknown => hist.length == 0
  //   mempool => hist.length == 1 && hist[0].height == 0
  //   confirm => hist.length > 0 && hist[0].height != 0
  //   spent   => hist.length == 2
  const notConfirmed = async (contract: Contract, artifact: Artifact) => {
    if (!network) return

    const [hist] = await chainSource.fetchHistories([
      address.toOutputScript(
        await getContractCovenantAddress(artifact, contract, network),
      ),
    ])
    const confirmed = hist.length > 0 && hist[0].height !== 0
    return !confirmed
  }

  // check contract status
  // for each contract in storage:
  // - check for creation tx (to confirm)
  // - check if unspend (for status)
  const checkContractsStatus = async () => {
    if (!network) return
    // function to check if contract has fuji coin
    const fujiCoins = await getFujiCoins()
    const hasCoin = (txid = '') => fujiCoins.some((coin) => coin.txid === txid)

    // iterate through contracts in storage
    for (const contract of getMyContractsFromStorage(network, xPubKey)) {
      if (!contract.txid) continue
      const artifact = contract.createdAt
        ? await artifactRepo.get(contract.createdAt)
        : await artifactRepo.getLatest()

      if (!contract.confirmed) {
        // if funding tx is not confirmed, we can skip this contract
        if (await notConfirmed(contract, artifact)) continue
        markContractConfirmed(contract)
      }
      // if contract is redeemed, topup or liquidated
      if (contractIsClosed(contract)) continue
      // check if contract is already spent
      const status = await checkContractOutspend(
        artifact,
        chainSource,
        contract,
        network,
      )
      if (!status) continue
      const { input, spent, timestamp } = status
      if (spent && input) {
        // contract already spent, let's find out why:
        // we will look at the leaf before the last one,
        // and based on his fingerprint find out if it was:
        // - liquidated (leaf asm will have 37 items)
        // - redeemed (leaf asm will have 47 items)
        // - topuped (leaf asm will have 27 items)
        const index = input.witness.length - 2
        const leaf = input.witness[index].toString('hex')
        switch (getFuncNameFromScriptHexOfLeaf(artifact, leaf)) {
          case 'liquidate':
            markContractLiquidated(contract, timestamp)
            continue
          case 'redeem':
            markContractRedeemed(contract, timestamp)
            continue
          case 'topup':
            markContractTopup(contract)
            continue
          default:
            markContractUnknown(contract)
            continue
        }
      } else {
        // contract not spent
        // if we have coin it means contract is still open
        if (hasCoin(contract.txid)) {
          markContractOpen(contract)
          continue
        }
        // if no coin, could be redeemed or topuped just now, or else is unknown
        if (
          contract.state !== ContractState.Redeemed &&
          contract.state !== ContractState.Topup
        ) {
          markContractUnknown(contract)
        }
      }
    }
  }

  // Marina could know about contracts that local storage doesn't
  // This could happen if the user is using more than one device
  // In this case, we will add the unknown contracts into storage
  const syncContractsWithMarina = async () => {
    if (!xPubKey) return
    const storageContracts = getContractsFromStorage()
    const marinaContracts = await getContractsFromMarina(assets)

    // check if contract from marina is on storage
    const notInStorage = (mc: Contract) =>
      storageContracts.some(
        (sc) => sc.txid === mc.txid && sc.vout === mc.vout,
      ) === false

    for (const contract of marinaContracts) {
      if (notInStorage(contract)) {
        // add xPubKey to contract
        contract.xPubKey = xPubKey
        // check creation date so that activity will match
        const setupTimestamp = contract.contractParams?.setupTimestamp
        const timestamp = setupTimestamp
          ? hex64LEToNumber(setupTimestamp)
          : undefined
        createNewContract(contract, timestamp)
      }
    }
  }

  // reload contracts on marina events: NEW_UTXO, SPENT_UTXO
  const setMarinaListener = () => {
    // try to avoid first burst of events sent by marina (on reload)
    const okToReload = (accountID: string) =>
      accountID === marinaFujiAccountID &&
      Date.now() - lastReload.current > 30000
    // add event listeners
    if (connected && marina && xPubKey) {
      const listenerFunction = async ({
        data: utxo,
      }: {
        utxo: Utxo
        data: any
      }) => {
        if (
          !utxo ||
          !utxo.scriptDetails ||
          !isIonioScriptDetails(utxo.scriptDetails)
        )
          return
        if (okToReload(utxo.scriptDetails.accountName))
          reloadAndMarkLastReload()
      }

      const idSpentUtxo = marina.on('SPENT_UTXO', listenerFunction)
      const idNewUtxo = marina.on('NEW_UTXO', listenerFunction)
      return () => {
        marina.off(idSpentUtxo)
        marina.off(idNewUtxo)
      }
    }
    return () => {}
  }

  const firstRender = useRef<NetworkString[]>([])

  useEffect(() => {
    async function runOnAssetsChange() {
      if (network && assets.length) {
        if (!firstRender.current.includes(network)) {
          await syncContractsWithMarina()
          firstRender.current.push(network)
        }
        await reloadContracts()
        setLoading(false)
        return setMarinaListener() // return the close listener function
      }
    }
    runOnAssetsChange()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assets, connected])

  return (
    <ContractsContext.Provider
      value={{
        activities,
        contracts,
        loading,
        newContract,
        oldContract,
        reloadContracts,
        resetContracts,
        setLoading,
        setNewContract,
        setOldContract,
      }}
    >
      {children}
    </ContractsContext.Provider>
  )
}
