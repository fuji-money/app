import { ECPairFactory } from 'ecpair'
import { Artifact, Contract } from '@ionio-lang/ionio'
import { Utxo, NetworkString, UnblindingData } from 'marina-provider'
import { ContractParams } from './types'
import { Coin, Wallet, WalletType } from './wallet'
import {
  AssetHash,
  ElementsValue,
  Pset,
  Transaction,
  Updater,
  address,
  confidential,
  networks,
} from 'liquidjs-lib'
import { ChainSource, WsElectrumChainSource } from './chainsource.port'
import { getMyContractsFromStorage } from './storage'
import { assetPair, expirationTimeout } from './constants'
import zkpLib from '@vulpemventures/secp256k1-zkp'
import * as ecc from 'tiny-secp256k1'
import { getIonioInstance } from './covenant'
import { getArtifact } from './artifact'
import { TransactionRepository } from './transactions-repository'
import { BlindersRepository } from './blinders-repository'

const ZERO_32 = Buffer.alloc(32, 0).toString('hex')

// epxosed as window.liquid by alby
interface LiquidProvider {
  getAddress(): Promise<{
    address: string
    blindingPrivateKey: string
    publicKey: string
  }>
  signPset(psetBase64: string): Promise<{ signed: string }>
  enable(): Promise<void>
  enabled: boolean
}

function detectAlbyProvider(): LiquidProvider {
  // @ts-ignore
  const provider = window['liquid']
  if (!provider) {
    throw new Error('window.liquid provider not found')
  }
  return new SafeLiquidProvider(provider as unknown as LiquidProvider)
}

// SafeLiquidProvider is a wrapper around LiquidProvider
// it ensures that only one call is active at a time
// Alby does not allow "parallel" calls
export class SafeLiquidProvider implements LiquidProvider {
  private hasActiveCall = false

  constructor(private provider: LiquidProvider) {}

  private waitUntilCallIsCompleted(): Promise<void> {
    return new Promise((resolve) => {
      const interval = setInterval(() => {
        if (!this.hasActiveCall) {
          clearInterval(interval)
          resolve()
        }
      }, 100)
    })
  }

  get enabled(): boolean {
    return this.provider.enabled
  }

  async getAddress(): Promise<{
    address: string
    blindingPrivateKey: string
    publicKey: string
  }> {
    if (this.hasActiveCall) await this.waitUntilCallIsCompleted()
    this.hasActiveCall = true
    try {
      const res = await this.provider.getAddress()
      return res
    } finally {
      this.hasActiveCall = false
    }
  }

  async signPset(psetBase64: string): Promise<{ signed: string }> {
    if (this.hasActiveCall) await this.waitUntilCallIsCompleted()
    this.hasActiveCall = true
    try {
      const res = await this.provider.signPset(psetBase64)
      return res
    } finally {
      this.hasActiveCall = false
    }
  }

  async enable(): Promise<void> {
    if (this.hasActiveCall) await this.waitUntilCallIsCompleted()
    this.hasActiveCall = true
    try {
      await this.provider.enable()
    } finally {
      this.hasActiveCall = false
    }
  }
}

// retry some times to detect provider
// ensures that we are not failing because the script is not loaded yet
async function safeDetectProvider(retry = 5): Promise<LiquidProvider> {
  let fails = 0
  while (fails < retry) {
    try {
      return detectAlbyProvider()
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      fails++
    }
  }

  throw new Error('window.liquid provider not found')
}

type ListenerFn = (...args: any[]) => void

enum ListenerType {
  NEW_UTXO,
  SPENT_UTXO,
}

export class AlbyWallet implements Wallet {
  type = WalletType.Alby

  private cacheCoins: Utxo[] = []
  private listeners: {
    id: string
    type: ListenerType
    callback: ListenerFn
  }[] = []

  private albyAddress:
    | Awaited<ReturnType<LiquidProvider['getAddress']>>
    | undefined

  private constructor(
    private provider: LiquidProvider,
    private txRepo: TransactionRepository,
    private blindersRepo: BlindersRepository,
  ) {}

  static async detect(
    txRepository: TransactionRepository,
    blindersRepository: BlindersRepository,
  ): Promise<AlbyWallet | undefined> {
    try {
      const provider = await safeDetectProvider()
      const wallet = new AlbyWallet(provider, txRepository, blindersRepository)
      if (!!provider.enabled) {
        await wallet.fetchAndSetAddress()
      }
      return wallet
    } catch {
      return undefined
    }
  }

  isConnected(): boolean {
    return true
  }

  private async getChainSource(): Promise<ChainSource> {
    const network = await this.getNetwork()
    return new WsElectrumChainSource(network)
  }

  // getAllScripts returns all the scripts signable by Alby wallet
  // scripts = Alby address + all the scripts of the contracts owned by the wallet
  private async getAllScripts(): Promise<string[]> {
    if (!this.albyAddress) await this.fetchAndSetAddress()
    const addr = this.albyAddress?.address
    if (!addr) throw new Error('Wallet not connected')
    const chainsource = await this.getChainSource()

    const contracts = getMyContractsFromStorage(
      chainsource.network,
      this.getMainAccountXPubKey(),
    )

    const artifact = await getArtifact()

    const ionioInstances = await Promise.allSettled(
      contracts.map((contract) => {
        return getIonioInstance(artifact, contract, chainsource.network)
      }),
    )

    const scripts = [address.toOutputScript(addr).toString('hex')]

    for (const res of ionioInstances) {
      if (res.status === 'fulfilled') {
        const ionioInstance = res.value
        const script = ionioInstance.scriptPubKey.toString('hex')
        scripts.push(script)
      }
    }

    return scripts
  }

  private async fetchAndSetAddress(): Promise<void> {
    this.albyAddress = await this.provider.getAddress()
  }

  async connect(): Promise<void> {
    await this.provider.enable()
    await this.fetchAndSetAddress()
    return Promise.resolve()
  }

  disconnect(): Promise<void> {
    this.albyAddress = undefined
    return Promise.resolve()
  }

  getMainAccountXPubKey(): string {
    if (!this.albyAddress) {
      throw new Error('Wallet not connected')
    }

    // we don't have a xpub key, so we return the address public, base64 encoded
    // this is used only to identify the wallet in DB
    return Buffer.from(this.albyAddress.publicKey, 'hex').toString('base64')
  }

  async getNetwork(): Promise<NetworkString> {
    if (!this.albyAddress) await this.fetchAndSetAddress()
    const addr = this.albyAddress?.address
    if (!addr) throw new Error('Wallet not connected')
    if (addr.startsWith('tlq')) return 'testnet'
    if (addr.startsWith('lq')) return 'liquid'
    throw new Error('Invalid address') // Alby does not support regtest
  }

  // Alby does not generate new addresses, it uses a single address-wallet
  async getNextAddress(): Promise<string> {
    if (!this.albyAddress) await this.fetchAndSetAddress()
    const addr = this.albyAddress?.address
    if (!addr) throw new Error('Wallet not connected')
    return addr
  }

  getNextChangeAddress(): Promise<string> {
    return this.getNextAddress() // Alby does not support change address (only 1 address per wallet)
  }

  async getNextCovenantAddress(
    artifact: Artifact,
    contractParameters: Omit<ContractParams, 'borrowerPublicKey'>,
  ): Promise<{
    confidentialAddress: string
    contractParams: ContractParams
  }> {
    if (!this.albyAddress) await this.fetchAndSetAddress()
    const addr = this.albyAddress
    if (!addr) throw new Error('Wallet not connected')

    const params = {
      ...contractParameters,
      borrowerPublicKey: `0x${(await this.getNewPublicKey()).substring(2)}`,
    }

    const network = await this.getNetwork()

    const constructorParams = [
      params.borrowAsset,
      params.borrowAmount,
      params.treasuryPublicKey,
      expirationTimeout,
      params.borrowerPublicKey,
      params.oraclePublicKey,
      params.priceLevel,
      params.setupTimestamp,
      assetPair,
    ]

    if (constructorParams.findIndex((a) => a === undefined) !== -1) {
      throw new Error('missing contract params')
    }

    const contract = new Contract(
      artifact,
      constructorParams,
      networks[network],
      {
        ecc,
        zkp: await zkpLib(),
      },
    )

    const blindingPubKey = ECPairFactory(ecc).fromPrivateKey(
      Buffer.from(addr.blindingPrivateKey, 'hex'),
    ).publicKey

    const confidentialAddress = address.toConfidential(
      contract.address,
      blindingPubKey,
    )

    const chainSource = await this.getChainSource()

    if (this.listeners.length > 0) {
      await this.subsribeScript(
        chainSource,
        contract.scriptPubKey.toString('hex'),
      )
    }

    return {
      confidentialAddress,
      contractParams: params,
    }
  }

  async getNewPublicKey(): Promise<string> {
    if (!this.albyAddress) await this.fetchAndSetAddress()
    const publicKey = this.albyAddress?.publicKey
    if (!publicKey) throw new Error('Wallet not connected')
    return publicKey
  }

  /**
   * signPset prepares the pset to be signed by Alby extension
   * it adds the internal key in the inputs locked by the default Alby address
   * it adds explicitAsset & explicitValue to the inputs owned by the Alby wallet (including covenants inputs)
   * @param psetBase64 to sign
   * @returns signed pset base64 encoded
   */
  async signPset(psetBase64: string): Promise<string> {
    await this.getCoins()
    if (!this.albyAddress) await this.fetchAndSetAddress()
    if (!this.albyAddress)
      throw new Error('user must authorize fuji app to get Alby address')

    const scripts = await this.getAllScripts()
    const isAlbyScript = (script: Buffer) => {
      const hex = script.toString('hex')
      return scripts.includes(hex)
    }

    const pset = Pset.fromBase64(psetBase64)
    const updater = new Updater(pset)

    // add internal key in inputs to sign (locekd by the default Alby address)
    // it lets to signal Ably to sign using key-path spend
    const internalKey = Buffer.from(this.albyAddress.publicKey, 'hex').subarray(
      1,
    )

    for (let i = 0; i < pset.inputs.length; i++) {
      const input = pset.inputs[i]

      if (!input.witnessUtxo) continue
      if (isAlbyScript(input.witnessUtxo.script)) {
        // Alby requests explicit asset and explicit value to be set for confidential inputs
        if (AssetHash.fromBytes(input.witnessUtxo.asset).isConfidential) {
          const unblindData = await this.blindersRepo.getBlindingData(
            Buffer.from(input.previousTxid).reverse().toString('hex'),
            input.previousTxIndex,
          )

          if (unblindData) {
            console.log('unblindData', unblindData)
            updater.addInExplicitAsset(
              i,
              AssetHash.fromHex(unblindData.asset).bytes,
              Buffer.from(unblindData.assetBlindingFactor, 'hex'),
            )
            updater.addInExplicitValue(
              i,
              unblindData.value,
              Buffer.from(unblindData.valueBlindingFactor, 'hex'),
            )
          }
        }

        if (input.tapLeafScript?.length) continue // it means we already signaled tap-leaf path (= covenant input)
        // if not, it means this is not the covenant input, but the Alby input
        // locked by the default Alby address (taproot key-path-spend only script)
        // to let Alby sign it, we need to specify the internalKey
        updater.addInTapInternalKey(i, internalKey)
      }
    }

    const { signed } = await this.provider.signPset(updater.pset.toBase64())
    return signed
  }

  async getCoins(): Promise<Coin[]> {
    if (!this.albyAddress) await this.fetchAndSetAddress()
    const blindPrvKey = this.albyAddress?.blindingPrivateKey
    if (!blindPrvKey) throw new Error('Wallet not connected')

    const allScripts = await this.getAllScripts()
    const chainSource = await this.getChainSource()

    const allUnspentsPromises = await Promise.allSettled(
      allScripts.map((script) => chainSource.listUnspents(script)),
    )

    const allUnspents: Awaited<ReturnType<ChainSource['listUnspents']>> = []

    for (const res of allUnspentsPromises) {
      if (res.status === 'fulfilled') {
        allUnspents.push(...res.value)
      } else {
        console.warn('Error fetching unspents', res.reason)
      }
    }

    // fetch transactions if needed
    const toFetch = new Set<string>()

    for (const unspent of allUnspents) {
      if (!(await this.txRepo.getTransaction(unspent.txid))) {
        toFetch.add(unspent.txid)
      }
    }

    if (toFetch.size > 0) {
      const txs = await chainSource.fetchTransactions(Array.from(toFetch))
      for (const { txID, hex } of txs) {
        await this.txRepo.addTransaction(txID, hex)
      }
    }

    const key = Buffer.from(blindPrvKey, 'hex')
    const unblinder = new confidential.Confidential(await zkpLib())

    const unblindedResults = await Promise.allSettled(
      allUnspents.map(async ({ txid, vout }) => {
        const txHex = await this.txRepo.getTransaction(txid)
        if (!txHex) throw new Error('Transaction not found')
        const tx = Transaction.fromHex(txHex)
        const output = tx.outs[vout]

        let blindingData: UnblindingData | undefined

        /// unconfidential case
        if (
          (!output.rangeProof || output.rangeProof.length === 0) &&
          (!output.surjectionProof || output.surjectionProof.length === 0)
        ) {
          blindingData = {
            asset: AssetHash.fromBytes(output.asset).hex,
            assetBlindingFactor: ZERO_32,
            value: ElementsValue.fromBytes(output.value).number,
            valueBlindingFactor: ZERO_32,
          }
        } else {
          // confidential case
          blindingData = await this.blindersRepo.getBlindingData(txid, vout)

          // unblind if needed

          if (!blindingData) {
            const unblinded = unblinder.unblindOutputWithKey(output, key)
            blindingData = {
              asset: AssetHash.fromBytes(unblinded.asset).hex,
              assetBlindingFactor:
                unblinded.assetBlindingFactor.toString('hex'),
              valueBlindingFactor:
                unblinded.valueBlindingFactor.toString('hex'),
              value: parseInt(unblinded.value),
            }
            await this.blindersRepo.addBlindingData(txid, vout, blindingData)
          }
        }

        return {
          txid,
          vout,
          witnessUtxo: output,
          blindingData,
        }
      }),
    )

    const unblinded: Coin[] = []

    for (const res of unblindedResults) {
      if (res.status === 'fulfilled') {
        unblinded.push(res.value)
      } else {
        console.warn('Error unblinding', res.reason)
      }
    }

    return unblinded
  }

  async getBalances(): Promise<Record<string, number>> {
    const utxos = await this.getCoins()
    return computeBalances(utxos)
  }

  private async subsribeScript(chainSource: ChainSource, script: string) {
    await chainSource.subscribeScriptStatus(
      Buffer.from(script, 'hex'),
      async (_, status) => {
        if (!status) return
        if (this.listeners.length === 0) return

        const utxos = await this.getCoins()
        // find new utxos
        const newUtxos = utxos.filter(
          (utxo) =>
            !this.cacheCoins.find(
              (cached) =>
                cached.txid === utxo.txid && cached.vout === utxo.vout,
            ),
        )
        // find spent utxos
        const spentUtxos = this.cacheCoins.filter(
          (cached) =>
            !utxos.find(
              (utxo) => cached.txid === utxo.txid && cached.vout === utxo.vout,
            ),
        )

        this.cacheCoins = utxos

        for (const { type, callback } of this.listeners) {
          switch (type) {
            case ListenerType.NEW_UTXO:
              for (const utxo of newUtxos) {
                callback(utxo)
              }
            case ListenerType.SPENT_UTXO:
              for (const utxo of spentUtxos) {
                callback(utxo)
              }
            default:
              continue
          }
        }
      },
    )
  }

  private addListener(type: ListenerType, callback: ListenerFn): string {
    const id = Math.floor(Math.random() * 10_0000).toString()
    this.listeners.push({ type, callback, id })

    // send subscriptions if it's the first listener
    if (this.listeners.length === 1) {
      const subscribeAll = async () => {
        const scripts = await this.getAllScripts()
        const chainSource = await this.getChainSource()
        for (const script of scripts) {
          await this.subsribeScript(chainSource, script)
        }
        await chainSource.close()
      }
      subscribeAll().catch(() => {})
    }

    return id
  }

  private removeListener(id: string) {
    const index = this.listeners.findIndex((l) => l.id === id)
    if (index === -1) return
    this.listeners.splice(index, 1)

    // unsubscribe if it's the last listener
    if (this.listeners.length === 0) {
      const unsubscribeAll = async () => {
        const scripts = await this.getAllScripts()
        const chainSource = await this.getChainSource()
        for (const script of scripts) {
          await chainSource.unsubscribeScriptStatus(Buffer.from(script, 'hex'))
        }
        await chainSource.close().catch(() => {})
      }
      unsubscribeAll().catch(() => {})
    }
  }

  onSpentUtxo(callback: (utxo: Coin) => void): () => void {
    const ID = this.addListener(ListenerType.SPENT_UTXO, callback)
    return () => this.removeListener(ID)
  }

  onNewUtxo(callback: (utxo: Coin) => void): () => void {
    const ID = this.addListener(ListenerType.NEW_UTXO, callback)
    return () => this.removeListener(ID)
  }
}

// computeBalances from unblinded utxos

function computeBalances(
  utxos: { blindingData?: UnblindingData }[],
): Record<string, number> {
  const balances: Record<string, number> = {}
  for (const utxo of utxos) {
    if (!utxo.blindingData) continue
    const { asset, value } = utxo.blindingData
    balances[asset] = (balances[asset] || 0) + value
  }
  return balances
}
