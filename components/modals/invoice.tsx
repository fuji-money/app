import { feeAmount, swapFeeAmount } from 'lib/constants'
import { prettyNumber } from 'lib/pretty'
import {
  fetchInvoiceFromLNURL,
  getInvoiceExpireDate,
  getInvoiceValue,
  submarineSwapBoltzFees,
} from 'lib/swaps'
import { Contract } from 'lib/types'
import { extractError, fromSatoshis, sleep, toSatoshis } from 'lib/utils'
import { useEffect, useState } from 'react'
import Modal, { ModalIds } from './modal'
import Image from 'next/image'

interface InvoiceModalProps {
  contract: Contract
  handler: (arg0: string) => void
}

const InvoiceModal = ({ contract, handler }: InvoiceModalProps) => {
  const [invoice, setInvoice] = useState('')
  const [text, setText] = useState('')
  const [valid, setValid] = useState(false)
  const [warning, setWarning] = useState('')

  const { collateral } = contract

  const amount = collateral.quantity - swapFeeAmount
  const boltzFees = submarineSwapBoltzFees(amount)
  const invoiceAmount = amount - boltzFees

  const handleChange = (e: any) => {
    const value = e.target.value
    setText(value ?? '')
  }

  const invalidWithWarning = (msg: string) => {
    setWarning(msg)
    setValid(false)
  }

  const validateInvoice = (): void => {
    if (!invoice) return invalidWithWarning('')
    // needs a try catch because a invalid invoice throws when decoding
    try {
      const { precision } = collateral
      if (toSatoshis(getInvoiceValue(invoice), precision) !== invoiceAmount) {
        return invalidWithWarning('Invalid amount on invoice')
      }
      if (getInvoiceExpireDate(invoice) < Date.now()) {
        return invalidWithWarning('Invalid expire date on invoice')
      }
    } catch (ignore) {
      return invalidWithWarning('Invalid invoice')
    }
    setWarning('')
    setValid(true)
  }

  useEffect(() => {
    async function updateInvoice() {
      try {
        setInvoice(
          text.includes('@') || text.match(/^LNURL/)
            ? await fetchInvoiceFromLNURL(text, invoiceAmount)
            : text,
        )
      } catch (e) {
        invalidWithWarning(extractError(e))
      }
    }
    updateInvoice()
  }, [invoiceAmount, text])

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => validateInvoice(), [invoice])

  const Separator = () => <p className="mx-3"> &ndash; </p>

  const pn = (n: number, precision: number) =>
    prettyNumber(fromSatoshis(n, precision), precision, precision)

  const copyInvoiceAmount = () => {
    navigator.clipboard.writeText(pn(invoiceAmount, collateral.precision)).then(
      () => {
        const target = document.getElementById('copyInfo')
        console.log('target', target)
        if (!target) return false
        target.style.visibility = 'visible'
        sleep(1000).then(() => (target.style.visibility = 'hidden'))
      },
      (err) => console.error('Could not copy text: ', err),
    )
  }

  return (
    <Modal id={ModalIds.Invoice}>
      <h3 className="mt-4">
        Enter a BOLT11 Lightning Invoice, <br />
        a Lightning address or <br />a LNURL pay link
      </h3>
      <p className="has-text-weight-semibold has-text-black">
        Amount: {pn(invoiceAmount, collateral.precision)}*
        <span className="image-container ml-3">
          <Image
            src="/images/icons/copy.svg"
            height={20}
            width={20}
            alt="copy icon"
            onClick={copyInvoiceAmount}
          />
        </span>
      </p>
      <p className="m-1">
        <span
          id="copyInfo"
          className="is-size-7 has-background-warning p-1"
          style={{ visibility: 'hidden' }}
        >
          Copied
        </span>
      </p>
      <div className="is-size-7 is-flex is-justify-content-center mb-4">
        <p>
          * Collateral amount
          <br />
          {pn(collateral.quantity, collateral.precision)}
        </p>
        <Separator />
        <p>
          Boltz fees
          <br />
          {pn(boltzFees, collateral.precision)}
        </p>
        <Separator />
        <p>
          Transaction fee
          <br />
          {pn(feeAmount, collateral.precision)}
        </p>
      </div>
      <textarea
        id="invoice"
        className="textarea"
        onChange={handleChange}
        placeholder="Paste invoice, address or lnurl here"
        rows={5}
      ></textarea>
      <p>&nbsp; {warning} &nbsp;</p>
      <button
        className="button is-primary"
        disabled={!valid}
        onClick={() => handler(invoice)}
      >
        Redeem
      </button>
    </Modal>
  )
}

export default InvoiceModal
