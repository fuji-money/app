import { NextPage } from 'next'
import { useRouter } from 'next/router'
import { useContext, useRef, useState } from 'react'
import Borrow from 'components/borrow'
import SomeError, { SomethingWentWrong } from 'components/layout/error'
import Offers from 'components/offers'
import { Asset, Contract, Outcome } from 'lib/types'
import Spinner from 'components/spinner'
import { ContractsContext } from 'components/providers/contracts'
import Channel from 'components/channel'
import EnablersLiquid from 'components/enablers/liquid'
import EnablersLightning from 'components/enablers/lightning'
import { ModalIds, ModalStages } from 'components/modals/modal'
import { randomBytes } from 'crypto'
import { feeAmount } from 'lib/constants'
import {
  getContractCovenantAddress,
  markContractConfirmed,
  saveContractToStorage,
} from 'lib/contracts'
import {
  prepareBorrowTxWithClaimTx,
  proposeBorrowContract,
  prepareBorrowTx,
  PreparedBorrowTx,
} from 'lib/covenant'
import { broadcastTx, signTx } from 'lib/marina'
import {
  createReverseSubmarineSwap,
  getInvoiceExpireDate,
  ReverseSwap,
} from 'lib/swaps'
import { openModal, extractError, retry, sleep } from 'lib/utils'
import {
  BIP174SigningData,
  Pset,
  Signer,
  witnessStackToScriptWitness,
  script as bscript,
  Finalizer,
  Transaction,
} from 'liquidjs-lib'
import ECPairFactory from 'ecpair'
import * as ecc from 'tiny-secp256k1'
import { WalletContext } from 'components/providers/wallet'
import MarinaDepositModal from 'components/modals/marinaDeposit'
import InvoiceDepositModal from 'components/modals/invoiceDeposit'
import { EnabledTasks, Tasks } from 'lib/tasks'
import NotAllowed from 'components/messages/notAllowed'
import { addSwapToStorage } from 'lib/storage'
import { finalizeTx } from 'lib/transaction'
import { WeblnContext } from 'components/providers/webln'
import { Utxo } from 'marina-provider'
import { ConfigContext } from 'components/providers/config'
import { toBlindingData } from 'liquidjs-lib/src/psbt'
import { Artifact } from '@ionio-lang/ionio'

const BorrowParams: NextPage = () => {
  const { chainSource, network, updateBalances, xPubKey } =
    useContext(WalletContext)
  const { weblnCanEnable, weblnProvider, weblnProviderName } =
    useContext(WeblnContext)
  const { artifactRepo, config } = useContext(ConfigContext)
  const { loading, newContract, reloadContracts, resetContracts } =
    useContext(ContractsContext)

  const [data, setData] = useState('')
  const [result, setResult] = useState('')
  const [invoice, setInvoice] = useState('')
  const [stage, setStage] = useState(ModalStages.NeedsCoins)
  const [useWebln, setUseWebln] = useState(false)

  const router = useRouter()
  const { params } = router.query

  const { offers, oracles } = config

  const resetModal = () => {
    resetContracts()
    history.go(-2)
  }

  interface ActiveSwap {
    keyPair: any
    preimage: Buffer
    redeemScript: string
    utxos: Utxo[]
  }

  // store swap here while is not spent
  const unspentSwap = useRef<ActiveSwap>()

  // make a swap via boltz.exchange
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
    artifact: Artifact,
  ) => {
    if (!network) return

    // change message to user
    setStage(ModalStages.NeedsFinishing)

    // broadcast transaction
    const rawHex = finalizeTx(pset)
    const { txid } = await broadcastTx(rawHex)
    newContract.txid = txid
    if (!newContract.txid) throw new Error('No txid returned')

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
    await saveContractToStorage({ ...newContract, createdAt: Date.now() })

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

    // show success
    setData(newContract.txid)
    setResult(Outcome.Success)
    setStage(ModalStages.ShowResult)
  }

  // handle payment through lightning invoice
  const handleInvoice = async (): Promise<void> => {
    // nothing to do if no new contract
    if (!newContract || !network) return

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

      const artifact = await artifactRepo.getLatest()

      // prepare borrow transaction with claim utxo as input
      const preparedTx = await prepareBorrowTxWithClaimTx(
        artifact,
        newContract,
        utxos,
        redeemScript,
        oracles[0],
        config.xOnlyTreasuryPublicKey,
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
      await finalizeAndBroadcast(pset, newContract, preparedTx, artifact)
    } catch (error) {
      console.error(error)
      setData(extractError(error))
      setResult(Outcome.Failure)
      setStage(ModalStages.ShowResult)
    }
  }

  // handle payment through Alby
  const handleAlby =
    weblnProviderName === 'Alby' &&
    network === 'liquid' &&
    (weblnProvider.enabled || weblnCanEnable)
      ? async () => {
          setUseWebln(true)
          await handleInvoice()
        }
      : undefined

  // handle payment through marina browser extension
  const handleMarina = async (): Promise<void> => {
    // nothing to do if no new contract
    if (!newContract || !network) return

    try {
      openModal(ModalIds.MarinaDeposit)
      setStage(ModalStages.NeedsCoins)

      const artifact = await artifactRepo.getLatest()

      // prepare borrow transaction
      const preparedTx = await prepareBorrowTx(
        artifact,
        newContract,
        oracles[0],
        config.xOnlyTreasuryPublicKey,
      )
      if (!preparedTx) throw new Error('Unable to prepare Tx')

      // propose contract to alpha factory
      setStage(ModalStages.NeedsFujiApproval)
      const { partialTransaction } = await proposeBorrowContract(
        preparedTx,
        network,
      )

      // sign and broadcast transaction
      setStage(ModalStages.NeedsConfirmation)
      const signedTransaction = await signTx(partialTransaction)

      // finalize and broadcast transaction
      const pset = Pset.fromBase64(signedTransaction)
      await finalizeAndBroadcast(pset, newContract, preparedTx, artifact)
    } catch (error) {
      console.error(error)
      setData(extractError(error))
      setResult(Outcome.Failure)
      setStage(ModalStages.ShowResult)
    }
  }

  if (!EnabledTasks[Tasks.Borrow]) return <NotAllowed />
  if (loading) return <Spinner />
  if (!offers) return <SomeError>Error getting offers</SomeError>
  if (!oracles) return <SomeError>Oracles not found</SomeError>
  if (!params || params.length > 4) return <SomeError>Invalid URL</SomeError>

  switch (params.length) {
    case 1:
      // /borrow/fUSD => show list of offers filtered by ticker
      return <Offers offers={offers} ticker={params[0]} />
    case 2:
      // /borrow/fUSD/L-BTC => show form to borrow synthetic
      const offer = offers.find(
        ({ synthetic, collateral }) =>
          synthetic.ticker === params[0] && collateral.ticker === params[1],
      )
      if (!offer) return <SomeError>Offer not found</SomeError>
      // check for values on assets (oracle could be down)
      const { collateral, synthetic } = offer
      const noVal = (asset: Asset) =>
        `Unable to get value for ${asset.ticker}. The oracle provider may be unavailable or you could be offline. Try again later.`
      if (!collateral.value)
        return (
          <SomeError>
            <SomethingWentWrong error={noVal(collateral)} />
          </SomeError>
        )
      if (!synthetic.value)
        return (
          <SomeError>
            <SomethingWentWrong error={noVal(synthetic)} />
          </SomeError>
        )
      // ok, proceed
      return <Borrow offer={offer} />
    case 3:
      if (!newContract) return <SomeError>Contract not found</SomeError>
      switch (params[2]) {
        // /borrow/fUSD/L-BTC/channel => show list of available payment methods
        case 'channel':
          return <Channel contract={newContract} task={Tasks.Borrow} />
        case 'liquid':
          // /borrow/fUSD/L-BTC/liquid => show list of liquid enablers
          return (
            <>
              <EnablersLiquid
                contract={newContract}
                handleMarina={handleMarina}
                task={Tasks.Borrow}
              />
              <MarinaDepositModal
                contract={newContract}
                data={data}
                result={result}
                retry={retry(setData, setResult, handleMarina, updateBalances)}
                reset={resetModal}
                stage={stage}
                task={Tasks.Borrow}
              />
            </>
          )
        case 'lightning':
          return (
            <>
              <EnablersLightning
                contract={newContract}
                handleAlby={handleAlby}
                handleInvoice={handleInvoice}
                task={Tasks.Borrow}
              />
              <InvoiceDepositModal
                contract={newContract}
                data={data}
                invoice={invoice}
                result={result}
                retry={retry(setData, setResult, handleInvoice, updateBalances)}
                reset={resetModal}
                stage={stage}
                task={Tasks.Borrow}
                useWebln={useWebln}
              />
            </>
          )
        default:
          return <SomeError>Invalid URL</SomeError>
      }
    default:
      return <SomeError>Invalid URL</SomeError>
  }
}

export default BorrowParams
