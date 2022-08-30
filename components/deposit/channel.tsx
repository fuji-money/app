import Image from 'next/image'
import { Contract } from 'lib/types'
import {
  createReverseSubmarineSwap,
  DEPOSIT_LIGHTNING_LIMITS,
  getInvoiceExpireDate,
  ReverseSwap,
  swapDepositAmountOutOfBounds,
} from 'lib/swaps'
import { prettyNumber } from 'lib/pretty'
import { WalletContext } from 'components/providers/wallet'
import { useContext } from 'react'
import { feeAmount, swapFeeAmount } from 'lib/constants'
import { fetchUtxos, Outpoint, Mnemonic } from 'ldk'
import { debugMessage, openModal, sleep } from 'lib/utils'
import * as ecc from 'tiny-secp256k1'
import { broadcastTx, getAssetBalance, getXPubKey } from 'lib/marina'
import ECPairFactory from 'ecpair'
import { randomBytes } from 'crypto'
import { prepareBorrowTxWithClaimTx, proposeBorrowContract } from 'lib/covenant'
import { createNewContract } from 'lib/contracts'
import { ContractsContext } from 'components/providers/contracts'
import { Psbt, witnessStackToScriptWitness } from 'liquidjs-lib'

const explorerURL = 'https://blockstream.info/liquidtestnet/api' // TODO

const waitForPayment = async (
  invoice: string,
  address: string,
): Promise<Outpoint[]> => {
  // check invoice expiration
  const invoiceExpireDate = Number(getInvoiceExpireDate(invoice))

  // wait for user to pay, check for utxos
  let utxos: Outpoint[] = []
  while (utxos.length === 0 && Date.now() <= invoiceExpireDate) {
    utxos = await fetchUtxos(address, explorerURL)
    debugMessage('searching for claim tx:', new Date())
    await sleep(5000) // sleep for 5 seconds
  }
  return utxos
}

interface ChannelProps {
  contract: Contract
  setChannel: any
  setData: any
  setResult: any
  setStep: any
  setSwap: any
}

const Channel = ({
  contract,
  setChannel,
  setData,
  setResult,
  setSwap,
}: ChannelProps) => {
  const { connected, balances, marina, network } = useContext(WalletContext)
  const { reloadContracts } = useContext(ContractsContext)

  if (!marina) throw new Error('Missing marina provider')

  const setError = (text: string) => {
    debugMessage(text)
    setData(text)
    setResult('failure')
  }

  const ticker = contract.collateral.ticker
  const quantity = contract.collateral.quantity || 0

  // check if button for Lightning should be disabled
  const { maximal, minimal } = DEPOSIT_LIGHTNING_LIMITS
  const outOfBounds = swapDepositAmountOutOfBounds(quantity)
  const lightningButtonDisabled = ticker !== 'L-BTC' || outOfBounds

  // check if button for Liquid should be disabled
  const funds = getAssetBalance(contract.collateral, balances)
  const needed = contract.collateral.quantity || 0
  const liquidButtonDisabled = !(connected && funds > needed)

  const handleLightning = async () => {
    // create ephemeral account
    const privateKey = randomBytes(32)
    const keyPair = ECPairFactory(ecc).fromPrivateKey(privateKey)

    // create swap with Boltz.exchange
    const invoiceAmount = quantity + feeAmount + swapFeeAmount + swapFeeAmount
    const swap: ReverseSwap | undefined = await createReverseSubmarineSwap(
      keyPair,
      network,
      invoiceAmount,
    )
    if (!swap) return setError('Error creating swap')

    // this shows the QR code to the user
    setSwap(swap)
    setChannel('lightning')

    // deconstruct swap
    const { invoice, lockupAddress, preimage, redeemScript } = swap

    // wait for payment
    const utxos = await waitForPayment(invoice, lockupAddress)

    // payment was never made, and the invoice expired
    if (utxos.length === 0) return setError('Invoice has expired')

    // payment made: prepare borrow transaction with claim utxo as input
    const preparedTx = await prepareBorrowTxWithClaimTx(
      contract,
      explorerURL,
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
  }

  return (
    <div>
      <div className="has-text-centered">
        <h2 className="has-text-weight-bold is-size-4 mb-4">
          Choose how to deposit {ticker}
        </h2>
        <div className="content mt-6">
          <button
            className="button is-primary"
            disabled={liquidButtonDisabled}
            onClick={() => setChannel('liquid')}
          >
            <Image
              src="/images/networks/liquid.svg"
              alt="liquid network logo"
              height={20}
              width={20}
            />
            Liquid Network
          </button>
          <button
            className="button is-primary"
            disabled={lightningButtonDisabled}
            onClick={handleLightning}
          >
            <Image
              src="/images/networks/lightning.svg"
              alt="lightning network logo"
              height={20}
              width={20}
            />
            Lightning
          </button>
        </div>
        {liquidButtonDisabled && (
          <div>
            <p className="warning mx-auto mt-6">Not enough funds on Marina.</p>
          </div>
        )}
        {lightningButtonDisabled && (
          <div>
            <p className="warning mx-auto mt-6">
              For lightning swaps, collateral amount must be between{' '}
              {prettyNumber(minimal, 0)} and {prettyNumber(maximal, 0)}{' '}
              satoshis.
            </p>
          </div>
        )}
      </div>
      <style jsx>{`
        button {
          margin: auto 1rem;
        }
        h2 {
          font-size: 1.5rem;
          font-weight: 700;
        }
        img {
          margin-right: 1rem;
          max-height: 1.42rem;
        }
        p.warning {
          max-width: 350px;
        }
      `}</style>
    </div>
  )
}

export default Channel
