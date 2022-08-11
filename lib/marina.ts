import { Asset, UtxoWithBlindPrivKey } from './types'
import {
  detectProvider,
  MarinaProvider,
  Balance,
  Utxo,
  AddressInterface,
  NetworkString,
} from 'marina-provider'
import {
  defaultNetwork,
  marinaFujiAccountID,
  marinaMainAccountID,
} from 'lib/constants'
import { synthAssetArtifact } from 'lib/artifacts'
import { Psbt, address } from 'liquidjs-lib'

export async function getBalances(): Promise<Balance[]> {
  const marina = await getMarinaProvider()
  if (!marina) return []
  if (!(await marina.isEnabled())) return []
  return await marina.getBalances([marinaMainAccountID])
}

export function getAssetBalance(asset: Asset, balances: Balance[]): number {
  const found = balances.find((a) => a.asset.assetHash === asset.id)
  if (!found || !found.amount) return 0
  return found.amount
}

export async function getMarinaProvider(): Promise<MarinaProvider | undefined> {
  if (typeof window === 'undefined') return undefined
  try {
    return await detectProvider('marina')
  } catch {
    console.log('Please install Marina extension')
    return undefined
  }
}

export async function getNetwork(): Promise<NetworkString> {
  const marina = await getMarinaProvider()
  if (marina) return await marina.getNetwork()
  return defaultNetwork
}

export async function getXPubKey(): Promise<string | undefined> {
  const marina = await getMarinaProvider()
  if (marina) {
    const info = await marina.getAccountInfo(marinaMainAccountID)
    return info.masterXPub
  }
}

export async function signAndBroadcastTx(partialTransaction: any) {
  // check for marina
  const marina = await getMarinaProvider()
  if (!marina) throw new Error('Please install Marina')

  // sign and broadcast transaction
  const ptx = Psbt.fromBase64(partialTransaction)
  const signedPtx = await marina.signTransaction(ptx.toBase64())
  const finalPtx = Psbt.fromBase64(signedPtx)
  finalPtx.finalizeAllInputs()
  console.log('finalPtx', finalPtx)
  const rawHex = finalPtx.extractTransaction().toHex()
  console.log('rawHex', rawHex)
  const sentTransaction = await marina.broadcastTransaction(rawHex)
  console.log('txid', sentTransaction.txid)
  return sentTransaction.txid
}

export function selectCoinsWithBlindPrivKey(
  utxos: UtxoWithBlindPrivKey[],
  addresses: AddressInterface[],
  asset: string,
  minAmount: number,
): UtxoWithBlindPrivKey[] {
  let totalValue = 0
  const selectedUtxos: Utxo[] = []

  // utils to get blinding private key for a coin/utxo
  const addressScript = (a: AddressInterface) =>
    address.toOutputScript(a.confidentialAddress).toString('hex')
  const utxoScript = (u: UtxoWithBlindPrivKey) =>
    u.prevout.script.toString('hex')
  const getUtxoBlindPrivKey = (u: Utxo) =>
    addresses.find((a) => addressScript(a) === utxoScript(u))
      ?.blindingPrivateKey

  // select coins and add blinding private key to them
  for (const utxo of utxos) {
    if (!utxo.value || !utxo.asset) continue
    if (utxo.asset === asset) {
      const blindPrivKey = getUtxoBlindPrivKey(utxo)
      if (!blindPrivKey) continue
      utxo.blindPrivKey = blindPrivKey
      selectedUtxos.push(utxo)
      totalValue += utxo.value
      if (totalValue >= minAmount) {
        return selectedUtxos
      }
    }
  }
  return []
}

export async function createFujiAccount(marina: MarinaProvider) {
  await marina.createAccount(marinaFujiAccountID)
  await marina.useAccount(marinaFujiAccountID)
  await marina.importTemplate({
    type: 'ionio-artifact',
    template: JSON.stringify(synthAssetArtifact),
  })
  await marina.useAccount(marinaMainAccountID)
}

export async function fujiAccountMissing(
  marina: MarinaProvider,
): Promise<boolean> {
  const accountIDs = await marina.getAccountsIDs()
  return !accountIDs.includes(marinaFujiAccountID)
}
