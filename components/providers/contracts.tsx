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
} from 'lib/contracts'
import {
  getContractsFromStorage,
  getMyContractsFromStorage,
  updateContractOnStorage,
} from 'lib/storage'
import { Activity, Contract, ContractState, Oracle } from 'lib/types'
import { WalletContext } from './wallet'
import { isIonioScriptDetails, NetworkString, Utxo } from 'marina-provider'
import { getActivities } from 'lib/activities'
import { getFuncNameFromScriptHexOfLeaf } from 'lib/covenant'
import { getFujiCoins } from 'lib/marina'
import BIP32Factory from 'bip32'
import * as ecc from 'tiny-secp256k1'
import { marinaFujiAccountID } from 'lib/constants'
import { fetchOracles } from 'lib/api'
import { toXpub } from 'lib/utils'
import { address, Transaction } from 'liquidjs-lib'
import { ChainSource } from 'lib/chainsource.port'

function computeOldXPub(xpub: string): string {
  const bip32 = BIP32Factory(ecc)
  const decoded = bip32.fromBase58(xpub)
  return bip32.fromPublicKey(decoded.publicKey, decoded.chainCode).toBase58()
}

type ContractStatus = {
  spent: boolean
  input?: Transaction['ins'][0]
  timestamp?: number
}

// checks if a given contract was already spent
// 1. fetch the contract funding transaction
// 2. because we need the covenant script
// 3. to calculate the corresponding address
// 4. to fetch this address history
// 5. to find out if it is already spent (history length = 2)
// 6. If is spent, we need to fetch the block header
// 7. because we need to know when was the spending tx
// 8. and we get it by deserialing the block header
// 9. Return the input where the utxo is used
async function checkContractOutspend(
  chainSource: ChainSource,
  contract: Contract,
  network: NetworkString,
): Promise<ContractStatus | undefined> {
  const covenantAddress = await getContractCovenantAddress(contract, network)
  const [hist] = await chainSource.fetchHistories([
    address.toOutputScript(covenantAddress),
  ])
  if (!hist || hist.length === 0) return // tx not found, not even on mempool
  if (hist.length === 1) return { spent: false }
  const { height, tx_hash } = hist[1] // spending tx
  // get timestamp from block header
  const { timestamp } = await chainSource.fetchBlockHeader(height)
  // return input from tx where contract was spent, we need this
  // to find out how it was spent (liquidated, topup or redeemed)
  // by analysing the taproot leaf used
  const [new_tx] = await chainSource.fetchTransactions([tx_hash])
  if (!new_tx) return
  const decodedTransaction = Transaction.fromHex(new_tx.hex)
  for (const input of decodedTransaction.ins) {
    if (contract.txid === Buffer.from(input.hash).reverse().toString('hex')) {
      return {
        input,
        spent: true,
        timestamp,
      }
    }
  }
}

interface ContractsContextProps {
  activities: Activity[]
  contracts: Contract[]
  loading: boolean
  newContract: Contract | undefined
  oldContract: Contract | undefined
  oracles: Oracle[]
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
  oracles: [],
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
  const [activities, setActivities] = useState<Activity[]>([])
  const [contracts, setContracts] = useState<Contract[]>([])
  const [loading, setLoading] = useState(true)
  const [newContract, setNewContract] = useState<Contract>()
  const [oldContract, setOldContract] = useState<Contract>()
  const [oracles, setOracles] = useState<Oracle[]>([])
  const { connected, marina, network, xPubKey, chainSource } =
    useContext(WalletContext)

  // save first time app was run
  const firstRun = useRef(Date.now())

  const reloadAndMarkLastReload = () => {
    firstRun.current = Date.now()
    reloadContracts()
  }

  const resetContracts = () => {
    setNewContract(undefined)
    setOldContract(undefined)
  }

  // update state (contracts, activities) with last changes on storage
  // setLoading(false) is there only to remove spinner on first render
  const reloadContracts = async () => {
    if (connected) {
      await checkContractsStatus()
      setContracts(await getContracts())
      setActivities(await getActivities())
      setLoading(false)
    }
  }

  // check contract status
  // for each contract in storage:
  // - check for creation tx (to confirm)
  // - check if unspend (for status)
  const checkContractsStatus = async () => {
    const fujiCoins = await getFujiCoins()
    const hasCoin = (txid = '') => fujiCoins.some((coin) => coin.txid === txid)
    for (const contract of getMyContractsFromStorage(network, xPubKey)) {
      if (!contract.txid) continue
      if (!contract.confirmed) {
        // if funding tx is not confirmed, we can skip this contract
        // TODO check if this returns false sometimes
        const confirmed = await chainSource.waitForConfirmation(
          contract.txid,
          await getContractCovenantAddress(contract, network),
        )
        if (!confirmed) continue
        markContractConfirmed(contract)
      }
      // if contract is redeemed, topup or liquidated
      if (contractIsClosed(contract)) continue
      // check if contract is already spent
      const status = await checkContractOutspend(chainSource, contract, network)
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
        switch (getFuncNameFromScriptHexOfLeaf(leaf)) {
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

  // it ensures that contract are all updated to the latest format
  const migrateOldContracts = () => {
    // migrate old contracts to new format
    getContractsFromStorage().map((contract) => {
      if (contract.contractParams && (contract as any)['borrowerPubKey']) {
        contract.contractParams = {
          ...contract.contractParams,
          borrowerPublicKey: (contract as any)['borrowerPubKey'],
          issuerPublicKey: (contract as any)['contractParams']['issuerPk'],
          oraclePublicKey: (contract as any)['contractParams']['oraclePk'],
        }
        delete (contract as any)['borrowerPubKey']
        delete (contract as any)['contractParams']['issuerPk']
        delete (contract as any)['contractParams']['oraclePk']
        updateContractOnStorage(contract)
      }
    })
  }

  // temporary fix:
  // 1. fix missing xPubKey on old contracts and store on local storage
  // 2. update old xPubKey ('zpub...') to new xPubKey ('xpub...')
  // 3. update xPubKey to neutered xPubKey
  // 4. add vout to contract
  const fixMissingXPubKeyOnOldContracts = () => {
    // get non neutered xPubKey
    const oldXPubKey = computeOldXPub(xPubKey)
    // on new Marina version, xPubKey starts with 'xpub' instead of 'zpub'
    const shouldStartWithXpub = xPubKey.startsWith('xpub')
    getContractsFromStorage()
      .filter((contract) => contract.network === network)
      .map((contract) => {
        if (!contract.xPubKey) {
          contract.xPubKey = xPubKey // point 1
          updateContractOnStorage(contract)
        } else {
          if (contract.xPubKey.startsWith('zpub') && shouldStartWithXpub) {
            contract.xPubKey = toXpub(contract.xPubKey) // point 2
            updateContractOnStorage(contract)
          } else {
            if (contract.xPubKey === oldXPubKey) {
              contract.xPubKey = xPubKey // point 3
              updateContractOnStorage(contract)
            }
          }
        }
        if (typeof contract.vout == 'undefined') {
          contract.vout = 0
          updateContractOnStorage(contract)
        }
      })
  }

  // reload contracts on marina events: NEW_UTXO, SPENT_UTXO
  const setMarinaListener = () => {
    // try to avoid first burst of events sent by marina (on reload)
    const okToReload = (accountID: string) =>
      accountID === marinaFujiAccountID && Date.now() - firstRun.current > 30000
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
    if (connected && network && xPubKey) {
      // run only on first render for each network
      if (!firstRender.current.includes(network)) {
        migrateOldContracts()
        fixMissingXPubKeyOnOldContracts()
        reloadContracts()
        fetchOracles().then((data) => setOracles(data))
        firstRender.current.push(network)
        return setMarinaListener() // return the close listener function
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [xPubKey])

  return (
    <ContractsContext.Provider
      value={{
        activities,
        contracts,
        loading,
        newContract,
        oldContract,
        oracles,
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
