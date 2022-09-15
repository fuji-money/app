import { Contract } from 'lib/types'
import Swap from 'components/deposit/swap'
import Marina from 'components/deposit/marina'
import Channel from 'components/deposit/channel'
import { randomBytes } from 'crypto'
import { feeAmount } from 'lib/constants'
import { createNewContract } from 'lib/contracts'
import {
  prepareBorrowTx,
  prepareBorrowTxWithClaimTx,
  proposeBorrowContract,
} from 'lib/covenant'
import { broadcastTx, getXPubKey, signAndBroadcastTx } from 'lib/marina'
import { createReverseSubmarineSwap, getInvoiceExpireDate } from 'lib/swaps'
import { Psbt, witnessStackToScriptWitness } from 'liquidjs-lib'
import ECPairFactory from 'ecpair'
import { NetworkString } from 'marina-provider'
import { fetchUtxos, Outpoint } from 'ldk'
import { explorerURL } from 'lib/explorer'
import { debugMessage, extractError, openModal, sleep } from 'lib/utils'
import * as ecc from 'tiny-secp256k1'
import { WalletContext } from 'components/providers/wallet'
import { useContext, useState } from 'react'
import MarinaDepositModal from 'components/modals/marinaDeposit'
import LightningDepositModal from 'components/modals/lightningDeposit'
import { ContractsContext } from 'components/providers/contracts'

interface BorrowDepositProps {
  contract: Contract
  channel: string
  setChannel: (arg0: string) => void
  setDeposit: (arg0: boolean) => void
}

const BorrowDeposit = ({
  contract,
  channel,
  setChannel,
  setDeposit,
}: BorrowDepositProps) => {
  const { network } = useContext(WalletContext)
  const { reloadContracts } = useContext(ContractsContext)

  const [data, setData] = useState('')
  const [result, setResult] = useState('')
  const [step, setStep] = useState(0)
  const [paid, setPaid] = useState(false)
  const [invoice, setInvoice] = useState('')

  const lightning = channel === 'lightning'
  const liquid = channel === 'liquid'

  const resetDeposit = () => {
    setChannel('')
    setDeposit(false)
    setData('')
    setResult('')
  }

  const handleLightning = async () => {
    openModal('lightning-deposit-modal')

    // every 5 seconds, query explorer for payment
    const waitForPayment = async (
      invoice: string,
      address: string,
      network: NetworkString,
    ): Promise<Outpoint[]> => {
      // check invoice expiration
      const invoiceExpireDate = Number(getInvoiceExpireDate(invoice))

      // wait for user to pay, check for utxos
      let utxos: Outpoint[] = []
      while (utxos.length === 0 && Date.now() <= invoiceExpireDate) {
        utxos = await fetchUtxos(address, explorerURL(network))
        debugMessage('searching for claim tx:', new Date())
        await sleep(5000) // sleep for 5 seconds
      }
      return utxos
    }

    try {
      // create ephemeral account
      const privateKey = randomBytes(32)
      const keyPair = ECPairFactory(ecc).fromPrivateKey(privateKey)

      // give enough satoshis to pay for all fees expected, so that we
      // can use the returning coin as a solo input for the borrow tx
      if (!contract.collateral.quantity) return
      const onchainAmount = contract.collateral.quantity + feeAmount

      // create swap with Boltz.exchange
      const boltzSwap = await createReverseSubmarineSwap(
        keyPair,
        network,
        onchainAmount,
      )
      if (!boltzSwap) throw new Error('Error creating swap')

      // deconstruct swap
      const { invoice, lockupAddress, preimage, redeemScript } = boltzSwap

      // show qr code to user
      setInvoice(invoice)

      // wait for payment
      const utxos = await waitForPayment(invoice, lockupAddress, network)

      // payment was never made, and the invoice expired
      if (utxos.length === 0) throw new Error('Invoice has expired')

      // show user (via modal) that payment was received
      setPaid(true)

      // prepare borrow transaction with claim utxo as input
      const preparedTx = await prepareBorrowTxWithClaimTx(
        contract,
        network,
        redeemScript,
        utxos,
      )

      // propose contract to alpha factory
      const { partialTransaction } = await proposeBorrowContract(preparedTx)

      // sign and finalize input[0]
      const psbt = Psbt.fromBase64(partialTransaction)
      psbt.signInput(0, keyPair)
      psbt.finalizeInput(0, (_, input) => {
        return {
          finalScriptSig: undefined,
          finalScriptWitness: witnessStackToScriptWitness([
            input.partialSig![0].signature,
            preimage,
            Buffer.from(redeemScript, 'hex'),
          ]),
        }
      })

      // broadcast transaction
      contract.txid = await broadcastTx(psbt.toBase64())

      // add additional fields to contract and save to storage
      contract.borrowerPubKey = preparedTx.borrowerPublicKey
      contract.contractParams = preparedTx.contractParams
      contract.network = network
      contract.confirmed = false
      contract.xPubKey = await getXPubKey()
      createNewContract(contract)

      // show success
      setData(contract.txid)
      setResult('success')
      reloadContracts()
    } catch (error) {
      setData(extractError(error))
      setResult('failure')
    }
  }

  const handleMarina = async () => {
    openModal('marina-deposit-modal')
    try {
      // prepare borrow transaction
      const preparedTx = await prepareBorrowTx(contract, network)

      // propose contract to alpha factory
      const { partialTransaction } = await proposeBorrowContract(preparedTx)

      // show user (via modal) that contract proposal was accepted
      setStep(1)

      // add additional fields to contract and save to storage
      contract.txid = await signAndBroadcastTx(partialTransaction)
      contract.borrowerPubKey = preparedTx.borrowerPublicKey
      contract.contractParams = preparedTx.contractParams
      contract.network = network
      contract.confirmed = false
      contract.xPubKey = await getXPubKey()
      createNewContract(contract)

      // show success
      setData(contract.txid)
      setResult('success')
      reloadContracts()
    } catch (error) {
      setData(extractError(error))
      setResult('failure')
    }
  }

  return (
    <>
      <div className="is-box has-pink-border p-6">
        {!channel && <Channel contract={contract} setChannel={setChannel} />}
        {lightning && <Swap contract={contract} handler={handleLightning} />}
        {liquid && <Marina contract={contract} handler={handleMarina} />}
      </div>
      <MarinaDepositModal
        data={data}
        result={result}
        reset={resetDeposit}
        step={step}
      />
      <LightningDepositModal
        data={data}
        invoice={invoice}
        paid={paid}
        result={result}
        reset={resetDeposit}
      />
    </>
  )
}

export default BorrowDeposit
