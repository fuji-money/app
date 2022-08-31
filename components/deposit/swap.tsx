import { Contract } from 'lib/types'
import { debugMessage, extractError, openModal, sleep } from 'lib/utils'
import {
  createReverseSubmarineSwap,
  getInvoiceExpireDate,
  ReverseSwap,
} from 'lib/swaps'
import { useContext, useState } from 'react'
import { randomBytes } from 'crypto'
import ECPairFactory from 'ecpair'
import { explorerURL } from 'lib/explorer'
import { createNewContract } from 'lib/contracts'
import { prepareBorrowTxWithClaimTx, proposeBorrowContract } from 'lib/covenant'
import { broadcastTx, getXPubKey } from 'lib/marina'
import { Psbt, witnessStackToScriptWitness } from 'liquidjs-lib'
import { NetworkString } from 'marina-provider'
import { fetchUtxos, Outpoint } from 'ldk'
import * as ecc from 'tiny-secp256k1'
import { WalletContext } from 'components/providers/wallet'
import Image from 'next/image'
import Summary from 'components/contract/summary'
import { feeAmount, swapFeeAmount } from 'lib/constants'
import LightningDepositModal from 'components/modals/lightningDeposit'
import { ContractsContext } from 'components/providers/contracts'

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

interface SwapProps {
  contract: Contract
}

const Swap = ({ contract }: SwapProps) => {
  const { network } = useContext(WalletContext)
  const { reloadContracts } = useContext(ContractsContext)
  const [paid, setPaid] = useState(false)
  const [invoice, setInvoice] = useState('')
  const [data, setData] = useState('')
  const [result, setResult] = useState('')
  const quantity = contract.collateral.quantity || 0

  const reset = () => {
    setData('')
    setResult('')
  }

  const handleLightning = async () => {
    try {
      // open modal
      openModal('lightning-deposit-modal')

      // create ephemeral account
      const privateKey = randomBytes(32)
      const keyPair = ECPairFactory(ecc).fromPrivateKey(privateKey)

      // give enough satoshis to pay for all fees expected, so that we
      // can use the returning coin as a solo input for the borrow tx
      const invoiceAmount = quantity + feeAmount + 2 * swapFeeAmount

      // create swap with Boltz.exchange
      const boltzSwap = await createReverseSubmarineSwap(
        keyPair,
        network,
        invoiceAmount,
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

  return (
    <div className="columns">
      <div className="column is-6">
        <p>
          <button className="button is-primary" onClick={handleLightning}>
            <Image
              src="/images/networks/lightning.svg"
              alt="lightning logo"
              width={20}
              height={20}
            />
            <span className="ml-2">Pay Lightning Invoice</span>
          </button>
        </p>
        <p>
          <button className="button is-primary mt-4" disabled>
            <span className="ml-2">Pay with Strike</span>
          </button>
        </p>
        <p>
          <button className="button is-primary mt-4" disabled>
            <span className="ml-2">Pay with Bitfinex Pay</span>
          </button>
        </p>
        <style jsx>{`
          .button {
            width: 100%;
          }
        `}</style>
      </div>
      <div className="column is-6">
        <Summary contract={contract} />
      </div>
      <LightningDepositModal
        data={data}
        invoice={invoice}
        paid={paid}
        result={result}
        reset={reset}
      />
    </div>
  )
}

export default Swap
