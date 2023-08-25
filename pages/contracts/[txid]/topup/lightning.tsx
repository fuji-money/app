import type { NextPage } from 'next'
import { useContext, useState } from 'react'
import { ContractsContext } from 'components/providers/contracts'
import EnablersLightning from 'components/enablers/lightning'
import { EnabledTasks, Tasks } from 'lib/tasks'
import InvoiceDepositModal from 'components/modals/invoiceDeposit'
import { WalletContext } from 'components/providers/wallet'
import { ModalIds, ModalStages } from 'components/modals/modal'
import SomeError from 'components/layout/error'
import { extractError, openModal, retry, sleep } from 'lib/utils'
import ECPairFactory from 'ecpair'
import * as ecc from 'tiny-secp256k1'
import { randomBytes } from 'crypto'
import {
  createReverseSubmarineSwap,
  getInvoiceExpireDate,
  ReverseSwap,
} from 'lib/swaps'
import {
  BIP174SigningData,
  Pset,
  Signer,
  Transaction,
  witnessStackToScriptWitness,
  script as bscript,
  Finalizer,
} from 'liquidjs-lib'
import {
  finalizeTopupCovenantInput,
  prepareTopupTx,
  proposeTopupContract,
} from 'lib/covenant'
import {
  getContractCovenantAddress,
  markContractConfirmed,
  markContractTopup,
  saveContractToStorage,
} from 'lib/contracts'
import { feeAmount } from 'lib/constants'
import NotAllowed from 'components/messages/notAllowed'
import { addSwapToStorage } from 'lib/storage'
import { Outcome } from 'lib/types'
import { finalizeTx } from 'lib/transaction'
import { WeblnContext } from 'components/providers/webln'
import { broadcastTx } from 'lib/marina'
import { ConfigContext } from 'components/providers/config'

const ContractTopupLightning: NextPage = () => {
  const { chainSource, marina, network, updateBalances } =
    useContext(WalletContext)
  const { weblnProviderName } = useContext(WeblnContext)
  const { artifactRepo, config } = useContext(ConfigContext)
  const { newContract, oldContract, reloadContracts, resetContracts } =
    useContext(ContractsContext)

  const [data, setData] = useState('')
  const [invoice, setInvoice] = useState('')
  const [result, setResult] = useState('')
  const [stage, setStage] = useState(ModalStages.NeedsCoins)
  const [useWebln, setUseWebln] = useState(false)

  const { oracles } = config

  const resetModal = () => {
    resetContracts()
    history.go(-1)
  }

  if (!EnabledTasks[Tasks.Topup]) return <NotAllowed />
  if (!newContract) return <SomeError>Contract not found</SomeError>
  if (!oldContract) return <SomeError>Contract not found</SomeError>

  const topupAmount =
    newContract.collateral.quantity - oldContract.collateral.quantity

  if (!newContract) throw new Error('Missing contract')

  const handleInvoice = async (): Promise<void> => {
    if (!marina || !network) return
    openModal(ModalIds.InvoiceDeposit)
    setStage(ModalStages.NeedsInvoice)
    try {
      // we will create a ephemeral key pair:
      // - it will generate a public key to be used with the Boltz swap
      // - later we will sign the claim transaction with the private key
      // all swaps are stored on storage and available to backup
      const privateKey = randomBytes(32)
      const keyPair = ECPairFactory(ecc).fromPrivateKey(privateKey)

      // give enough satoshis to pay for all fees expected, so that we
      // can use the returning coin as a solo input for the topup tx
      const onchainTopupAmount = topupAmount + feeAmount

      // create swap with boltz.exchange
      const boltzSwap: ReverseSwap | undefined =
        await createReverseSubmarineSwap(
          keyPair.publicKey,
          network,
          onchainTopupAmount,
        )
      if (!boltzSwap) {
        // save used keys on storage
        addSwapToStorage({
          boltzRefund: {
            privateKey: privateKey.toString('hex'),
          },
          contractId: oldContract.txid || '',
          publicKey: keyPair.publicKey.toString('hex'),
          status: Outcome.Failure,
          task: Tasks.Topup,
        })
        throw new Error('Error creating swap')
      }

      // deconstruct swap
      const {
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
        task: Tasks.Topup,
      })

      // show qr code to user
      setInvoice(invoice)
      setStage(ModalStages.NeedsPayment)

      // prepare timeout handler
      const invoiceExpireDate = Number(getInvoiceExpireDate(invoice))
      const invoiceExpirationTimeout = setTimeout(() => {
        throw new Error('invoice expired')
      }, invoiceExpireDate - Date.now())

      // wait for confirmation
      await chainSource.waitForAddressReceivesTx(lockupAddress)

      // fetch utxos for address
      const utxos = await chainSource.listUnspents(lockupAddress)

      // payment has arrived
      if (utxos.length > 0) {
        // clear invoice expiration timeout
        clearTimeout(invoiceExpirationTimeout)

        // show user (via modal) that payment was received
        setStage(ModalStages.PaymentReceived)
        await sleep(2000)
        setStage(ModalStages.NeedsFujiApproval)

        // get prevout for utxo
        const [utxo] = utxos
        const value = onchainTopupAmount
        const collateralUtxos = [{ ...utxo, value, redeemScript }]

        if (!oldContract.createdAt)
          throw new Error('oldContract has no createdAt member')
        const artifact = await artifactRepo.get(oldContract.createdAt)

        // prepare borrow transaction with claim utxo as input
        const preparedTx = await prepareTopupTx(
          artifact,
          newContract,
          oldContract,
          network,
          collateralUtxos,
          oracles[0],
          config.xOnlyTreasuryPublicKey,
        )

        // propose contract to alpha factory
        const { partialTransaction } = await proposeTopupContract(
          preparedTx,
          network,
        )
        if (!partialTransaction) throw new Error('Not accepted by Fuji')

        // sign collateral input with ephemeral key pair
        const aux = Pset.fromBase64(partialTransaction)
        const signer = new Signer(aux)

        const sig: BIP174SigningData = {
          partialSig: {
            pubkey: keyPair.publicKey,
            signature: bscript.signature.encode(
              keyPair.sign(preimage),
              Transaction.SIGHASH_ALL,
            ),
          },
        }
        signer.addSignature(1, sig, Pset.ECDSASigValidator(ecc))

        // ask user to sign tx with marina
        setStage(ModalStages.NeedsConfirmation)
        const base64 = await marina.signTransaction(signer.pset.toBase64())
        const ptx = Pset.fromBase64(base64)

        // tell user we are now on the final stage of the process
        setStage(ModalStages.NeedsFinishing)

        // finalize covenant input
        finalizeTopupCovenantInput(ptx)

        const finalizer = new Finalizer(ptx)
        // finalize input[1] - collateral via claim transaction
        finalizer.finalizeInput(1, (inIndex, pset) => {
          return {
            finalScriptSig: undefined,
            finalScriptWitness: witnessStackToScriptWitness([
              pset.inputs![inIndex].partialSigs![0].signature,
              preimage,
              Buffer.from(redeemScript, 'hex'),
            ]),
          }
        })

        // broadcast transaction
        const rawHex = finalizeTx(finalizer.pset)
        const { txid } = await broadcastTx(rawHex)
        newContract.txid = txid
        if (!newContract.txid) throw new Error('No txid returned')

        // add vout to contract
        const covenantVout = 1
        newContract.vout = covenantVout

        // add contractParams to contract
        const { contractParams } = preparedTx
        newContract.contractParams = { ...contractParams }

        // add additional fields to contract and save to storage
        // note: save before mark as confirmed (next code block)
        await saveContractToStorage(newContract)

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

        // mark old contract as topup
        markContractTopup(oldContract)

        // show success
        setData(newContract.txid)
        setResult('success')
        setStage(ModalStages.ShowResult)
      }
    } catch (error) {
      setData(extractError(error))
      setResult('failure')
      setStage(ModalStages.ShowResult)
    }
  }

  const handleAlby =
    weblnProviderName === 'Alby' && network === 'liquid'
      ? async () => {
          setUseWebln(true)
          await handleInvoice()
        }
      : undefined

  return (
    <>
      <EnablersLightning
        contract={newContract}
        handleAlby={handleAlby}
        handleInvoice={handleInvoice}
        task={Tasks.Topup}
      />
      <InvoiceDepositModal
        contract={newContract}
        data={data}
        invoice={invoice}
        result={result}
        retry={retry(setData, setResult, handleInvoice, updateBalances)}
        reset={resetModal}
        stage={stage}
        task={Tasks.Topup}
        useWebln={useWebln}
      />
    </>
  )
}

export default ContractTopupLightning
