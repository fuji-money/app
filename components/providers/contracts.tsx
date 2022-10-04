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
} from 'lib/contracts'
import {
  getContractsFromStorage,
  getMyContractsFromStorage,
  updateContractOnStorage,
} from 'lib/storage'
import { Activity, Contract, ContractState, Oracle } from 'lib/types'
import { WalletContext } from './wallet'
import { NetworkString } from 'marina-provider'
import { getActivities } from 'lib/activities'
import { checkOutspend, getTx } from 'lib/explorer'
import { getFuncNameFromScriptHexOfLeaf } from 'lib/covenant'
import { getFujiCoins } from 'lib/marina'
import { toXpub } from 'ldk'
import BIP32Factory from 'bip32'
import * as ecc from 'tiny-secp256k1'
import { marinaFujiAccountID } from 'lib/constants'
import { fetchOracles } from 'lib/api'

function computeOldXPub(xpub: string): string {
  const bip32 = BIP32Factory(ecc)
  const decoded = bip32.fromBase58(xpub)
  return bip32.fromPublicKey(decoded.publicKey, decoded.chainCode).toBase58()
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
  const { connected, marina, network, xPubKey } = useContext(WalletContext)

  // save first time app was run
  const firstRun = useRef(Date.now())

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
        const tx = await getTx(contract.txid, network)
        if (!tx?.status?.confirmed) continue
        markContractConfirmed(contract)
      }
      // check if contract is already spent
      const status = await checkOutspend(contract, network)
      if (!status) continue
      if (status.spent) {
        // contract already spent, let's find out why:
        // we will look at the leaf before the last one,
        // and based on his fingerprint find out if it was:
        // - liquidated (leaf asm will have 37 items)
        // - redeemed (leaf asm will have 47 items)
        // - topuped (leaf asm will have 27 items)
        const { txid, vin } = status
        const spentTx = await getTx(txid, network)
        if (!spentTx) continue
        const index = spentTx.vin[vin].witness.length - 2
        const leaf = spentTx.vin[vin].witness[index]
        switch (getFuncNameFromScriptHexOfLeaf(leaf)) {
          case 'liquidate':
            markContractLiquidated(contract, spentTx)
            continue
          case 'redeem':
            markContractRedeemed(contract, spentTx)
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

  // on a NEW_TX event for fuji account, reload contracts
  // this approach brings a heavy load on the explorer,
  // since on reload Marina emits all Tx for each account,
  // so if Fuji account has many Tx it will hammer the explorer.
  // the alternative would be to use SPENT_UTXO, but borrow contracts
  // funded with Lightning swap does not use any UTXO, so marina never
  // emits that event on those types of contracts
  const setMarinaListener = () => {
    // try to avoid first burst of NEW_TX sent by marina
    const goForReload = (payload: any) =>
      payload.accountID === marinaFujiAccountID &&
      Date.now() - firstRun.current > 60000
    // add event listeners
    if (connected && marina && xPubKey) {
      marina.on('NEW_TX', async (payload) => {
        console.log('NEW_TX', payload.accountID)
        if (goForReload(payload)) reloadContracts()
      })
      marina.on('SPENT_UTXO', async (payload) => {
        console.log('SPENT_UTXO', payload.accountID)
        if (goForReload(payload)) reloadContracts()
      })
      marina.on('NEW_UTXO', async (payload) => {
        console.log('NEW_UTXO', payload.accountID)
        if (goForReload(payload)) reloadContracts()
      })
    }
  }

  const firstRender = useRef<NetworkString[]>([])

  useEffect(() => {
    if (connected && network && xPubKey) {
      // run only on first render for each network
      if (!firstRender.current.includes(network)) {
        fixMissingXPubKeyOnOldContracts()
        setMarinaListener()
        reloadContracts()
        fetchOracles().then((data) => setOracles(data))
        firstRender.current.push(network)
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
        setNewContract,
        setOldContract,
      }}
    >
      {children}
    </ContractsContext.Provider>
  )
}
