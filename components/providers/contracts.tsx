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
  markContractUnconfirmed,
  markContractConfirmed,
} from 'lib/contracts'
import {
  getContractsFromStorage,
  getMyContractsFromStorage,
  updateContractOnStorage,
} from 'lib/storage'
import { Activity, Contract, ContractState } from 'lib/types'
import { WalletContext } from './wallet'
import { NetworkString } from 'marina-provider'
import { getActivities } from 'lib/activities'
import { checkOutspend, getTx } from 'lib/explorer'
import { getFuncNameFromScriptHexOfLeaf } from 'lib/covenant'
import { getFujiCoins } from 'lib/marina'
import { toXpub } from 'ldk'
import BIP32Factory from 'bip32'
import * as ecc from 'tiny-secp256k1'

function computeOldXPub(xpub: string): string {
  const bip32 = BIP32Factory(ecc)
  const decoded = bip32.fromBase58(xpub)
  return bip32.fromPublicKey(decoded.publicKey, decoded.chainCode).toBase58()
}

interface ContractsContextProps {
  activities: Activity[]
  contracts: Contract[]
  loading: boolean
  reloadContracts: () => void
}

export const ContractsContext = createContext<ContractsContextProps>({
  activities: [],
  contracts: [],
  loading: true,
  reloadContracts: () => {},
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
      // check if contract is confirmed
      // if funding tx is not confirmed, we can skip this contract
      const tx = await getTx(contract.txid, network)
      if (!tx?.status?.confirmed) {
        markContractUnconfirmed(contract)
        continue
      }
      markContractConfirmed(contract)
      // check if contract is already spent
      const status = await checkOutspend(contract, network)
      if (status.spent) {
        // contract already spent, let's find out why:
        // we will look at the leaf before the last one,
        // and based on his fingerprint find out if it was:
        // - liquidated (leaf asm will have 37 items)
        // - redeemed (leaf asm will have 47 items)
        // - topuped (leaf asm will have 27 items)
        const { txid, vin } = status
        const spentTx = await getTx(txid, network)
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
            markContractRedeemed(contract, spentTx)
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
        // if no coin, could be redeemed just now, or else is unknown
        if (contract.state !== ContractState.Redeemed) {
          markContractUnknown(contract)
        }
      }
    }
  }

  // temporary fix:
  // 1. fix missing xPubKey on old contracts and store on local storage
  // 2. update old xPubKey ('zpub...') to new xPubKey ('xpub...')
  // 3. update xPubKey to neutered xPubKey
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
      })
  }

  // on a SPENT_UTXO event reload contracts
  // don't use NEW_TX, on reload Marina emits a NEW_TX for all TXs,
  // which cause a lot of spam on the explorer (#tx * #contracts * 2 queries)
  const onNewTxListener = () => {
    if (connected && marina)
      marina.on('SPENT_UTXO', async () => reloadContracts())
  }

  const firstRender = useRef<NetworkString[]>([])

  useEffect(() => {
    if (connected && network && xPubKey) {
      // run only on first render for each network
      if (!firstRender.current.includes(network)) {
        fixMissingXPubKeyOnOldContracts()
        onNewTxListener()
        firstRender.current.push(network)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connected, network, xPubKey])

  // update contracts
  useEffect(() => {
    if (connected && marina) reloadContracts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connected, marina, network, xPubKey])

  return (
    <ContractsContext.Provider
      value={{ activities, contracts, loading, reloadContracts }}
    >
      {children}
    </ContractsContext.Provider>
  )
}
