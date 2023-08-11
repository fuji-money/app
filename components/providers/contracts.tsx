import {
  createContext,
  ReactNode,
  useCallback,
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
import { getMyContractsFromStorage } from 'lib/storage'
import { Activity, Contract, ContractState } from 'lib/types'
import { WalletContext } from './wallet'
import { NetworkString } from 'marina-provider'
import { getActivities } from 'lib/activities'
import { getFuncNameFromScriptHexOfLeaf } from 'lib/covenant'
import { address } from 'liquidjs-lib'
import { ConfigContext } from './config'
import { ChainSource, WsElectrumChainSource } from 'lib/chainsource.port'
import { Wallet } from 'lib/wallet'
import { hex64LEToNumber } from 'lib/utils'

interface ContractsContextProps {
  activities: Activity[]
  contracts: Contract[]
  loading: boolean
  newContract: Contract | undefined
  oldContract: Contract | undefined
  getContract(txID: string): Contract | undefined
  reloadContracts: () => Promise<void>
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
  getContract: () => undefined,
  reloadContracts: () => Promise.resolve(),
  resetContracts: () => {},
  setLoading: () => {},
  setNewContract: () => {},
  setOldContract: () => {},
})

interface ContractsProviderProps {
  children: ReactNode
}

export const ContractsProvider = ({ children }: ContractsProviderProps) => {
  const { wallets, network } = useContext(WalletContext)
  const { artifact, config, reloadConfig } = useContext(ConfigContext)

  const [activities, setActivities] = useState<Activity[]>([])
  const [contracts, setContracts] = useState<Contract[]>([])
  const [loading, setLoading] = useState(true)
  const [newContract, setNewContract] = useState<Contract>()
  const [oldContract, setOldContract] = useState<Contract>()

  const { assets } = config

  // save first time app was run
  const lastReload = useRef(Date.now())

  const reloadAndMarkLastReload = async () => {
    lastReload.current = Date.now()
    await Promise.allSettled([reloadContracts(), reloadConfig()])
  }

  const resetContracts = () => {
    setNewContract(undefined)
    setOldContract(undefined)
  }

  const getContract = useCallback(
    (txID: string) => {
      return contracts.find((contract) => contract.txid === txID)
    },
    [contracts],
  )

  // update state (contracts, activities) with last changes on storage
  // setLoading(false) is there only to remove spinner on first render
  const reloadContracts = async () => {
    console.time('reloadContracts')
    if (wallets && wallets.length > 0) {
      await checkContractsStatus()
      const contracts = await getContracts(
        wallets.map((w) => w.getMainAccountXPubKey()),
        assets,
        network,
      )

      if (contracts.length > 0) {
        setContracts(contracts)
        setActivities(await getActivities(wallets))
      }
      setLoading(false)
    }
    console.timeEnd('reloadContracts')
  }

  // check if a contract is confirmed by its transaction history
  // https://electrumx.readthedocs.io/en/latest/protocol-methods.html#blockchain-scripthash-get-history
  // In summary:
  //   unknown => hist.length == 0
  //   mempool => hist.length == 1 && hist[0].height == 0
  //   confirm => hist.length > 0 && hist[0].height != 0
  //   spent   => hist.length == 2
  const notConfirmed = async (contract: Contract, chainSource: ChainSource) => {
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
    if (wallets.length === 0) return
    // function to check if contract has fuji coin
    for (const wallet of wallets) {
      const network = await wallet.getNetwork()

      // open a websocket connection to explorer
      const chainSource = new WsElectrumChainSource(network)

      // iterate through contracts in storage
      for (const contract of getMyContractsFromStorage(
        network,
        wallet.getMainAccountXPubKey(),
      )) {
        if (!contract.txid) continue
        if (!contract.confirmed) {
          // if funding tx is not confirmed, we can skip this contract
          if (await notConfirmed(contract, chainSource)) continue
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
          try {
            if (
              contract.vout !== undefined &&
              (await wallet.getContractCoin(contract.txid, contract.vout))
            ) {
              markContractOpen(contract)
              continue
            }
          } catch (e) {
            console.warn('error', e)
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

      await chainSource.close().catch(() => {}) // ignore errors from close
    }
  }

  // Wallet could know about contracts that local storage doesn't
  // This could happen if the user is using more than one device
  // In this case, we will add the unknown contracts into storage
  const syncContractsWithWallet = async (wallet: Wallet) => {
    if (!wallet.getContracts) {
      console.warn(
        `wallet ${wallet.type} can't sync with localstorage. If you are using this wallet on several devices, you may not see all your contracts.`,
      )
      return
    }
    const network = await wallet.getNetwork()
    if (network === 'regtest') return
    const walletXPub = wallet.getMainAccountXPubKey()
    const walletContracts = await wallet.getContracts(assets)
    const storageContracts = getMyContractsFromStorage(network, walletXPub)

    const notInStorage = (contract: Contract) =>
      storageContracts.some(
        (sc) => sc.txid === contract.txid && sc.vout === contract.vout,
      ) === false

    for (const contract of walletContracts.filter(notInStorage)) {
      try {
        if (!contract) continue
        // check creation date so that activity will match
        const setupTimestamp = contract.contractParams?.setupTimestamp
        const timestamp = setupTimestamp
          ? hex64LEToNumber(setupTimestamp)
          : undefined

        createNewContract(contract, timestamp)
      } catch (e) {
        console.error(e)
      }
    }
  }

  // reload contracts on marina events: NEW_UTXO, SPENT_UTXO
  const setWalletListener = () => {
    // try to avoid first burst of events sent by marina (on reload)
    const okToReload = () => Date.now() - lastReload.current > 30000
    // add event listeners
    if (wallets.length > 0) {
      const listenerFunction = async () => {
        if (okToReload()) await reloadAndMarkLastReload()
      }

      const closeFns: (() => void)[] = []

      for (const wallet of wallets) {
        closeFns.push(wallet.onNewUtxo(listenerFunction))
        closeFns.push(wallet.onSpentUtxo(listenerFunction))
      }
      return () => closeFns.forEach((fn) => fn())
    }

    return () => {}
  }

  const firstRender = useRef<NetworkString[]>([])

  useEffect(() => {
    async function runOnAssetsChange() {
      if (assets.length) {
        if (!firstRender.current.includes(network)) {
          await Promise.allSettled(
            wallets.map((w) => syncContractsWithWallet(w)),
          )
          firstRender.current.push(network)
          await reloadContracts()
        }
        setLoading(false)
        return setWalletListener() // return the close listener function
      }
    }
    runOnAssetsChange().catch(console.error)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assets])

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
        getContract,
      }}
    >
      {children}
    </ContractsContext.Provider>
  )
}
