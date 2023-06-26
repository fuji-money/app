import type { NextPage } from 'next'
import { useContext, useEffect, useRef, useState } from 'react'
import SomeError from 'components/layout/error'
import { EnabledTasks, Tasks } from 'lib/tasks'
import { ContractsContext } from 'components/providers/contracts'
import NotAllowed from 'components/messages/notAllowed'
import EnablersLightning from 'components/enablers/lightning'
import PayWithLightningModal from 'components/modals/payWithLightning'
import ReceiveWithLightningModal from 'components/modals/receiveWithLightning'
import { ModalIds, ModalStages } from 'components/modals/modal'
import { ConfigContext } from 'components/providers/config'
import { WalletContext } from 'components/providers/wallet'
import { findBestMarket, getTradeType } from 'lib/tdex/market'
import {
  AssetPair,
  TDEXv2Market,
  TDEXv2PreviewTradeResponse,
} from 'lib/tdex/types'
import {
  PreparedBorrowTx,
  prepareBorrowTxWithClaimTx,
  proposeBorrowContract,
} from 'lib/covenant'
import { Contract, ContractResponse, Outcome, Outpoint } from 'lib/types'
import { openModal, extractError, sleep, closeModal } from 'lib/utils'
import {
  Pset,
  Signer,
  Transaction,
  BIP174SigningData,
  Finalizer,
  witnessStackToScriptWitness,
  script as bscript,
} from 'liquidjs-lib'
import { Utxo } from 'marina-provider'
import { feeAmount } from 'lib/constants'
import {
  saveContractToStorage,
  getContractCovenantAddress,
  markContractConfirmed,
} from 'lib/contracts'
import { broadcastTx, getNextAddress, getPublicKey, signTx } from 'lib/marina'
import { addSwapToStorage } from 'lib/storage'
import {
  ReverseSwap,
  createReverseSubmarineSwap,
  createSubmarineSwap,
  getInvoiceExpireDate,
} from 'lib/swaps'
import { finalizeTx } from 'lib/transaction'
import { toBlindingData } from 'liquidjs-lib/src/psbt'
import { randomBytes } from 'crypto'
import ECPairFactory from 'ecpair'
import { ECPairInterface } from 'ecpair'
import * as ecc from 'tiny-secp256k1'
import { proposeTrade, completeTrade } from 'lib/tdex/trade'
import { tradePreview } from 'lib/tdex/preview'
import { Unspent } from 'lib/chainsource.port'

const MultiplyLightning: NextPage = () => {
  const { chainSource, network, xPubKey } = useContext(WalletContext)
  const { artifact, config } = useContext(ConfigContext)
  const { newContract, reloadContracts } = useContext(ContractsContext)

  const [data, setData] = useState('')
  const [invoice, setInvoice] = useState('')
  const [market, setMarket] = useState<TDEXv2Market>()
  const [preview, setPreview] = useState<TDEXv2PreviewTradeResponse>()
  const [result, setResult] = useState('')
  const [stage, setStage] = useState(ModalStages.NeedsInvoice)
  const [useWebln, setUseWebln] = useState(false)

  const { oracles } = config

  interface ActiveSwap {
    keyPair: ECPairInterface
    swap: ReverseSwap
  }

  interface PaidSwap {
    preimage: Buffer
    redeemScript: string
    utxos: Unspent[]
  }

  // store swap here while is not spent
  const unspentSwap = useRef<ActiveSwap>()

  // fetch and set markets (needs to fetch providers)
  useEffect(() => {
    if (network && newContract) {
      const pair: AssetPair = {
        from: newContract.synthetic,
        dest: newContract.collateral,
      }
      findBestMarket(network, pair)
        .then((market) => {
          setMarket(market)
          if (market) {
            const { from, dest } = pair
            const type = getTradeType(market, pair)
            tradePreview(from, dest, market, type)
              .then((preview) => setPreview(preview))
              .catch((err) => console.error(err))
          }
        })
        .catch((err) => console.error(err))
    }
  }, [network, newContract])

  const makeReverseSwap = async (): Promise<ActiveSwap | undefined> => {
    if (!network) return
    setStage(ModalStages.NeedsInvoice)

    // we will create a ephemeral key pair:
    // - it will generate a public key to be used with the Boltz swap
    // - later we will sign the claim transaction with the private key
    // all swaps are stored on storage and available for backup
    const privateKey = randomBytes(32)
    const keyPair = ECPairFactory(ecc).fromPrivateKey(privateKey)

    // give enough satoshis to pay for all fees expected, so that we
    // can use the returning coin as a solo input for the borrow tx
    if (!newContract) throw new Error('no contract found')
    if (!newContract.collateral.quantity)
      throw new Error('no collateral quantity')
    const onchainAmount = newContract.collateral.quantity + feeAmount

    // create swap with Boltz.exchange
    const swap: ReverseSwap | undefined = await createReverseSubmarineSwap(
      keyPair.publicKey,
      network,
      onchainAmount,
    )

    // check if swap was successful
    if (!swap) {
      // save used keys on storage
      addSwapToStorage({
        boltzRefund: {
          privateKey: privateKey.toString('hex'),
        },
        contractId: newContract.txid || '',
        publicKey: keyPair.publicKey.toString('hex'),
        status: Outcome.Failure,
        task: Tasks.Borrow,
      })
      throw new Error('Error creating swap')
    }

    return { keyPair, swap }
  }

  const waitForSwapPayment = async (
    swap: ReverseSwap,
  ): Promise<PaidSwap | undefined> => {
    if (!network) return

    // prepare timeout handler
    const invoiceExpireDate = Number(getInvoiceExpireDate(swap.invoice))
    const invoiceExpirationTimeout = setTimeout(() => {
      throw new Error('invoice expired')
    }, invoiceExpireDate - Date.now())

    // wait for tx to be available (mempool or confirmed)
    await chainSource.waitForAddressReceivesTx(swap.lockupAddress)

    // fetch utxos for address
    const utxos = await chainSource.listUnspents(swap.lockupAddress)
    const u = utxos[0]
    const { asset, assetBlindingFactor, value, valueBlindingFactor } =
      await toBlindingData(Buffer.from(swap.blindingKey, 'hex'), u.witnessUtxo)

    u.blindingData = {
      asset: asset.reverse().toString('hex'),
      assetBlindingFactor: assetBlindingFactor.toString('hex'),
      value: parseInt(value, 10),
      valueBlindingFactor: valueBlindingFactor.toString('hex'),
    }

    // clear invoice expiration timeout
    clearTimeout(invoiceExpirationTimeout)

    // check if any utxo was returned
    if (utxos.length === 0) throw new Error('error making swap')

    // show user (via modal) that payment has arrived
    setStage(ModalStages.PaymentReceived)
    await sleep(2000) // give him time to see the green mark

    return {
      preimage: swap.preimage,
      redeemScript: swap.redeemScript,
      utxos,
    }
  }

  // finalize and broadcast proposed transaction
  const finalizeAndBroadcast = async (
    resp: ContractResponse,
    newContract: Contract,
    preparedTx: PreparedBorrowTx,
    activeSwap: ActiveSwap,
  ): Promise<string | undefined> => {
    if (!network) return

    // sign the input & add the signature via custom finalizer
    const pset = Pset.fromBase64(resp.partialTransaction)
    const signer = new Signer(pset)
    const toSign = signer.pset.getInputPreimage(0, Transaction.SIGHASH_ALL)
    const sig: BIP174SigningData = {
      partialSig: {
        pubkey: activeSwap.keyPair.publicKey,
        signature: bscript.signature.encode(
          activeSwap.keyPair.sign(toSign),
          Transaction.SIGHASH_ALL,
        ),
      },
    }

    signer.addSignature(0, sig, Pset.ECDSASigValidator(ecc))
    const finalizer = new Finalizer(pset)

    finalizer.finalizeInput(0, (inputIndex, pset) => {
      return {
        finalScriptSig: undefined,
        finalScriptWitness: witnessStackToScriptWitness([
          pset.inputs![inputIndex].partialSigs![0].signature,
          activeSwap.swap.preimage,
          Buffer.from(activeSwap.swap.redeemScript, 'hex'),
        ]),
      }
    })

    // broadcast transaction
    const rawHex = finalizeTx(pset)
    const { txid } = await broadcastTx(rawHex)
    if (!txid) throw new Error('No txid returned')

    newContract.txid = txid

    // swap utxo is now spent
    unspentSwap.current = undefined

    // add vout to contract
    const covenantVout = 0
    newContract.vout = covenantVout

    // add contractParams to contract
    const { contractParams } = preparedTx
    newContract.contractParams = { ...contractParams }
    newContract.xPubKey = xPubKey

    // add additional fields to contract and save to storage
    // note: save before mark as confirmed (next code block)
    await saveContractToStorage({ ...newContract })

    // wait for confirmation, mark contract confirmed and reload contracts
    chainSource
      .waitForConfirmation(
        newContract.txid,
        await getContractCovenantAddress(artifact, newContract, network),
      )
      .then(() => {
        markContractConfirmed(newContract)
        reloadContracts()
      })

    return txid
  }

  // when multiplying with lightning, we need to:
  // 1. collect an ln invoice where exposure will be collected
  // 2. make a reverse submarine swap (LN => LBTC) to get invoice
  // 3. show invoice from 2. in qrcode format and string (with copy)
  // 4. wait for ln payment (will result in one or more utxos)
  // 5. use utxos from 4. to fund mint operation with factory
  // 6. broadcast borrow/mint transaction (will result in a fuji utxo)
  // 7. make a submarine swap (LBTC => LN) with invoice from 1. (will result an address)
  // 8. propose a TDEX trade (FUSD => LBTC) with following params:
  //    - use fuji utxo from 6. as input
  //    - use address from 7. as output
  // 9. sign and complete TDEX transaction
  const handleInvoice = async (receivingInvoice?: string): Promise<void> => {
    // nothing to do if no new contract, network or market
    if (!newContract || !network || !market) return

    // 1. show modal to user to collect receiving invoice
    if (!receivingInvoice || typeof receivingInvoice !== 'string')
      return openModal(ModalIds.ReceiveWithLightning)
    closeModal(ModalIds.ReceiveWithLightning)

    try {
      // 2. make a reverse submarine swap
      openModal(ModalIds.PayWithLightning)
      // if there's an unspent swap, we will use it
      const activeSwap = unspentSwap.current ?? (await makeReverseSwap())
      if (!activeSwap) throw new Error('Error generating submarine swap')
      // save this swap for the case this process fails after the swap
      // we don't want users to have to make the swap again
      unspentSwap.current = activeSwap

      // 3. show lightning invoice to user
      setInvoice(activeSwap.swap.invoice)
      setStage(ModalStages.NeedsPayment)

      // 4. wait for swap payment
      const paidSwap = await waitForSwapPayment(activeSwap.swap)
      if (!paidSwap) throw new Error('Error waiting for swap payment')

      // 5. use utxos to fund mint operation with factory
      setStage(ModalStages.NeedsFujiApproval)
      // prepare borrow transaction with claim utxo as input
      const preparedTx = await prepareBorrowTxWithClaimTx(
        artifact,
        newContract,
        paidSwap.utxos,
        paidSwap.redeemScript,
        oracles[0],
      )
      // propose contract to alpha factory
      const resp = await proposeBorrowContract(preparedTx, network)
      if (!resp.partialTransaction) throw new Error('Not accepted by Fuji')

      // 6. broadcast borrow/mint transaction (will result in a fuji utxo)
      setStage(ModalStages.NeedsFinishing)
      const txid = await finalizeAndBroadcast(
        resp,
        newContract,
        preparedTx,
        activeSwap,
      )
      if (!txid) throw new Error('Error broadcasting transaction')
      // where we can find this fuji coin
      const outpoint: Outpoint = { txid, vout: preparedTx.pset.outputs.length }

      // 7. make a submarine swap (LBTC => LN) with invoice from 1. (will result an address)
      setStage(ModalStages.NeedsAddress)
      const refundPublicKey = (
        await getPublicKey(await getNextAddress())
      ).toString('hex')
      // create swap with Boltz.exchange
      const boltzSwap = await createSubmarineSwap(
        receivingInvoice,
        network,
        refundPublicKey,
      )
      if (!boltzSwap) throw new Error('Error creating swap')

      // 8. propose a TDEX trade (FUSD => LBTC)
      setStage(ModalStages.NeedsTDEXSwap)
      const pair = { from: newContract.synthetic, dest: newContract.collateral }
      const propose = await proposeTrade(
        market,
        pair,
        outpoint,
        boltzSwap.address,
      )
      if (!propose.swapAccept) throw new Error('TDEX swap not accepted')

      // 9. sign and complete TDEX transaction
      setStage(ModalStages.NeedsConfirmation)
      const signedTx = await signTx(propose.swapAccept.transaction)
      // complete TDEX trade
      setStage(ModalStages.NeedsFinishing)
      const completeResponse = await completeTrade(propose, market, signedTx)
      if (!completeResponse.txid) throw new Error('Error completing TDEX swap')

      // show success
      setData(completeResponse.txid)
      setResult(Outcome.Success)
      setStage(ModalStages.ShowResult)
    } catch (error) {
      console.error(error)
      setData(extractError(error))
      setResult(Outcome.Failure)
      setStage(ModalStages.ShowResult)
    }
  }

  const resetDeposit = () => {}

  if (!EnabledTasks[Tasks.Multiply]) return <NotAllowed />
  if (!newContract) return <SomeError>Contract not found</SomeError>
  if (!newContract.exposure) return <SomeError>Invalid contract</SomeError>

  const receivingQuantity = Number(
    newContract.exposure -
      newContract.collateral.quantity -
      Number(preview?.feeAmount ?? 0),
  )

  return (
    <>
      <EnablersLightning
        contract={newContract}
        handleAlby={handleInvoice}
        handleInvoice={handleInvoice}
        task={Tasks.Multiply}
      />
      <PayWithLightningModal
        contract={newContract}
        data={data}
        invoice={invoice}
        result={result}
        reset={resetDeposit}
        retry={() => {}}
        stage={stage}
        task={Tasks.Multiply}
        useWebln={useWebln}
      />
      <ReceiveWithLightningModal
        contract={newContract}
        handler={handleInvoice}
        quantity={receivingQuantity}
      />
    </>
  )
}

export default MultiplyLightning
