import Image from 'next/image'
import { Contract } from 'lib/types'
import {
  createReverseSubmarineSwap,
  DEPOSIT_LIGHTNING_LIMITS,
  getClaimTransaction,
  getInvoiceExpireDate,
  swapDepositAmountOutOfBounds,
} from 'lib/swaps'
import { prettyNumber } from 'lib/pretty'
import { WalletContext } from 'components/providers/wallet'
import { useContext } from 'react'
import { feeAmount, swapFeeAmount } from 'lib/constants'
import { fetchUtxos, Outpoint, Mnemonic } from 'ldk'
import { closeModal, openModal, sleep } from 'lib/utils'
import * as ecc from 'tiny-secp256k1'
import { getAssetBalance } from 'lib/marina'

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
    console.log('searching for claim tx:', new Date())
    await sleep(5000) // sleep for 5 seconds
  }
  return utxos
}

interface ChannelProps {
  contract: Contract
  setChannel: any
  setData: any
  setResult: any
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
  if (!marina) throw new Error('Missing marina provider')

  const setError = (text: string) => {
    closeModal('swap-modal')
    console.log(text)
    setData(text)
    setResult('failure')
  }

  const ticker = contract.collateral.ticker
  const quantity = contract.collateral.quantity || 0

  // check if button for Lightning should be disabled
  const { maximal, minimal } = DEPOSIT_LIGHTNING_LIMITS
  const outOfBounds = swapDepositAmountOutOfBounds(quantity)
  const LightningButtonDisabled = ticker !== 'L-BTC' || outOfBounds

  // check if button for Liquid should be disabled
  const funds = getAssetBalance(contract.collateral, balances)
  const needed = contract.collateral.quantity || 0
  const LiquidButtonDisabled = !(connected && funds > needed)

  const handleLightning = async () => {
    // create ephemeral account
    const account = Mnemonic.Random(network, ecc)

    // create swap with Boltz.exchange
    const invoiceAmount = quantity + feeAmount + swapFeeAmount
    const swap = await createReverseSubmarineSwap(
      account,
      network,
      invoiceAmount,
    )
    if (!swap) return setError('Error creating swap')

    // this shows the QR code to the user
    setSwap(swap)
    setChannel('lightning')

    const { invoice, lockupAddress, nextAddress, preimage, redeemScript } = swap

    // wait for payment
    const utxos = await waitForPayment(invoice, lockupAddress)

    // payment was never made, and the invoice expired
    if (utxos.length === 0) return setError('Invoice has expired')

    // payment made: by setting utxos, swap modal will open
    openModal('swap-modal')
    console.log('utxos', utxos)

    // get claim transaction
    let claimTransaction
    try {
      claimTransaction = await getClaimTransaction(
        account,
        nextAddress,
        explorerURL,
        network,
        preimage,
        redeemScript,
        utxos,
      )
    } catch (err: any) {
      return setError(`error getting claim transaction: ${err}`)
    }

    // broadcast claim transaction
    try {
      const txid = await marina.broadcastTransaction(claimTransaction.toHex())
      console.log('new coin', txid)
    } catch (err: any) {
      return setError(`error broadcasting claim transaction: ${err}`)
    }
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
            disabled={LiquidButtonDisabled}
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
            disabled={LightningButtonDisabled}
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
        {LiquidButtonDisabled && (
          <div>
            <p className="warning mx-auto mt-6">Not enough funds on Marina.</p>
          </div>
        )}
        {LightningButtonDisabled && (
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
