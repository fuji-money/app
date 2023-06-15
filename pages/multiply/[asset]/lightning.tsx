import type { NextPage } from 'next'
import { useContext, useEffect, useRef, useState } from 'react'
import SomeError from 'components/layout/error'
import { EnabledTasks, Tasks } from 'lib/tasks'
import { ContractsContext } from 'components/providers/contracts'
import NotAllowed from 'components/messages/notAllowed'
import EnablersLightning from 'components/enablers/lightning'
import InvoiceDepositModal from 'components/modals/invoiceDeposit'
import InvoiceModal from 'components/modals/invoice'
import { ModalIds, ModalStages } from 'components/modals/modal'
import { ConfigContext } from 'components/providers/config'
import { WalletContext } from 'components/providers/wallet'
import { findBestMarket } from 'lib/tdex/market'
import { AssetPair, TDEXv2Market } from 'lib/tdex/types'
import oracles from 'components/oracles'
import {
  PreparedBorrowTx,
  prepareBorrowTxWithClaimTx,
  proposeBorrowContract,
} from 'lib/covenant'
import { Contract, Outcome, Outpoint } from 'lib/types'
import { openModal, extractError, sleep } from 'lib/utils'
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
import { broadcastTx, signTx } from 'lib/marina'
import { addSwapToStorage } from 'lib/storage'
import {
  ReverseSwap,
  createReverseSubmarineSwap,
  getInvoiceExpireDate,
} from 'lib/swaps'
import { finalizeTx } from 'lib/transaction'
import { toBlindingData } from 'liquidjs-lib/src/psbt'
import { randomBytes } from 'crypto'
import ECPairFactory from 'ecpair'
import * as ecc from 'tiny-secp256k1'
import { proposeTrade, completeTrade } from 'lib/tdex/trade'

const MultiplyLightning: NextPage = () => {
  const { chainSource, network, xPubKey } = useContext(WalletContext)
  const { artifact, config } = useContext(ConfigContext)
  const { newContract, reloadContracts } = useContext(ContractsContext)

  const [data, setData] = useState('')
  const [invoice, setInvoice] = useState('')
  const [market, setMarket] = useState<TDEXv2Market>()
  const [result, setResult] = useState('')
  const [stage, setStage] = useState(ModalStages.NeedsInvoice)
  const [useWebln, setUseWebln] = useState(false)

  const { offers, oracles } = config

  interface ActiveSwap {
    keyPair: any
    preimage: Buffer
    redeemScript: string
    utxos: Utxo[]
  }

  // store swap here while is not spent
  const unspentSwap = useRef<ActiveSwap>()

  // fetch and set markets (needs to fetch providers)
  useEffect(() => {
    if (network && newContract) {
      const assetPair: AssetPair = {
        from: newContract.synthetic,
        dest: newContract.collateral,
      }
      findBestMarket(network, assetPair)
        .then((market) => setMarket(market))
        .catch((err) => console.error(err))
    }
  }, [network, newContract])

  const makeSwap = async (): Promise<ActiveSwap | undefined> => {
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
    const boltzSwap: ReverseSwap | undefined = await createReverseSubmarineSwap(
      keyPair.publicKey,
      network,
      onchainAmount,
    )

    // check if swap was successful
    if (!boltzSwap) {
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

    // deconstruct swap
    const {
      blindingKey,
      id,
      invoice,
      lockupAddress,
      preimage,
      redeemScript,
      timeoutBlockHeight,
    } = boltzSwap

    // save ephemeral key on storage
    addSwapToStorage({
      boltzRefund: {
        id,
        privateKey: privateKey.toString('hex'),
        redeemScript,
        timeoutBlockHeight,
      },
      contractId: newContract.txid || '',
      publicKey: keyPair.publicKey.toString('hex'),
      status: Outcome.Success,
      task: Tasks.Borrow,
    })

    // show lightning invoice to user
    setInvoice(invoice)
    setStage(ModalStages.NeedsPayment)

    // prepare timeout handler
    const invoiceExpireDate = Number(getInvoiceExpireDate(invoice))
    const invoiceExpirationTimeout = setTimeout(() => {
      throw new Error('invoice expired')
    }, invoiceExpireDate - Date.now())

    // wait for tx to be available (mempool or confirmed)
    await chainSource.waitForAddressReceivesTx(lockupAddress)

    // fetch utxos for address
    const utxos = await chainSource.listUnspents(lockupAddress)
    const u = utxos[0]
    const { asset, assetBlindingFactor, value, valueBlindingFactor } =
      await toBlindingData(Buffer.from(blindingKey, 'hex'), u.witnessUtxo)

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

    return { keyPair, preimage, redeemScript, utxos }
  }

  // finalize and broadcast proposed transaction
  const finalizeAndBroadcast = async (
    pset: Pset,
    newContract: Contract,
    preparedTx: PreparedBorrowTx,
  ): Promise<string | undefined> => {
    if (!network) return

    // change message to user
    setStage(ModalStages.NeedsFinishing)

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

  const handleInvoice = async (): Promise<void> => {
    // nothing to do if no new contract
    if (!newContract || !network || !market) return

    try {
      openModal(ModalIds.InvoiceDeposit)

      // if there's an unspent swap, we will use it
      const swap = unspentSwap.current ?? (await makeSwap())
      if (!swap) return
      const { keyPair, preimage, redeemScript, utxos } = swap

      // save this swap for the case this process fails after the swap
      // we don't users to have to make the swap again
      unspentSwap.current = { keyPair, preimage, redeemScript, utxos }

      // inform user we asking permission to mint
      setStage(ModalStages.NeedsFujiApproval)

      // prepare borrow transaction with claim utxo as input
      const preparedTx = await prepareBorrowTxWithClaimTx(
        artifact,
        newContract,
        utxos,
        redeemScript,
        oracles[0],
      )

      // propose contract to alpha factory
      const resp = await proposeBorrowContract(preparedTx, network)
      if (!resp.partialTransaction) throw new Error('Not accepted by Fuji')

      // sign the input & add the signature via custom finalizer
      const pset = Pset.fromBase64(resp.partialTransaction)
      const signer = new Signer(pset)
      const toSign = signer.pset.getInputPreimage(0, Transaction.SIGHASH_ALL)
      const sig: BIP174SigningData = {
        partialSig: {
          pubkey: keyPair.publicKey,
          signature: bscript.signature.encode(
            keyPair.sign(toSign),
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
            preimage,
            Buffer.from(redeemScript, 'hex'),
          ]),
        }
      })

      // finalize and broadcast transaction
      const txid = await finalizeAndBroadcast(pset, newContract, preparedTx)
      if (!txid) throw new Error('Error broadcasting transaction')

      // where we can find this fuji coin
      const outpoint: Outpoint = { txid, vout: preparedTx.pset.outputs.length }

      setStage(ModalStages.NeedsTDEXSwap)

      const pair = { from: newContract.synthetic, dest: newContract.collateral }
      const propose = await proposeTrade(market, pair, outpoint)
      if (!propose.swapAccept) throw new Error('TDEX swap not accepted')

      setStage(ModalStages.NeedsConfirmation)

      const signedTx = await signTx(propose.swapAccept.transaction)

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

  return (
    <>
      <EnablersLightning
        contract={newContract}
        handleAlby={handleInvoice}
        handleInvoice={handleInvoice}
        task={Tasks.Multiply}
      />
      <InvoiceDepositModal
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
      <InvoiceModal contract={newContract} handler={handleInvoice} />
    </>
  )
}

export default MultiplyLightning
