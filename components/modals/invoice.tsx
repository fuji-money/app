import { feeAmount } from 'lib/constants'
import { prettyNumber } from 'lib/pretty'
import {
  getInvoiceExpireDate,
  getInvoiceValue,
  submarineSwapBoltzFees,
} from 'lib/swaps'
import { Contract } from 'lib/types'
import { fromSatoshis, toSatoshis } from 'lib/utils'
import { useState } from 'react'
import Modal from './modal'

interface InvoiceModalProps {
  contract: Contract
  handler: (arg0: string) => void
}

const InvoiceModal = ({ contract, handler }: InvoiceModalProps) => {
  const [valid, setValid] = useState(false)
  const [warning, setWarning] = useState('')

  const { collateral, payoutAmount } = contract

  if (!collateral.quantity) throw new Error('Contract without collateral')
  if (!payoutAmount) throw new Error('Contract without payout amount')

  const amount = collateral.quantity - payoutAmount - feeAmount
  const boltzFees = submarineSwapBoltzFees(amount)
  const invoiceAmount = amount - boltzFees

  const getInvoice = (): string =>
    (document.getElementById('invoice') as HTMLInputElement).value

  const validateInvoice = (): void => {
    const invalidWithWarning = (msg: string) => {
      setWarning(msg)
      setValid(false)
    }
    const invoice = getInvoice()
    if (!invoice) return invalidWithWarning('')
    // needs a try catch because a invalid invoice throws when decoding
    try {
      if (toSatoshis(getInvoiceValue(invoice)) !== invoiceAmount) {
        return invalidWithWarning('Invalid amount on invoice')
      }
      if (getInvoiceExpireDate(invoice) < Date.now()) {
        return invalidWithWarning('Invalid expire date on invoice')
      }
    } catch (_) {
      return invalidWithWarning('Invalid invoice')
    }
    setWarning('')
    setValid(true)
  }

  const Separator = () => <p className="mx-3"> &ndash; </p>
  const pn = (n: number) => prettyNumber(fromSatoshis(n), 8)

  return (
    <Modal id={'invoice-modal'}>
      <h3 className="mt-4">Enter BOLT11 Lightning Invoice</h3>
      <p className="has-text-weight-semibold mb-4">
        Amount: {pn(invoiceAmount)}*
      </p>
      <div className="is-size-7 is-flex is-justify-content-center mb-4">
        <p>
          * Collateral amount
          <br />
          {pn(collateral.quantity)}
        </p>
        <Separator />
        <p>
          Payout amount
          <br />
          {pn(payoutAmount)}
        </p>

        <Separator />
        <p>
          Boltz fees
          <br />
          {pn(boltzFees)}
        </p>
        <Separator />
        <p>
          Transaction fee
          <br />
          {pn(feeAmount)}
        </p>
      </div>
      <textarea
        id="invoice"
        className="textarea"
        onChange={validateInvoice}
        placeholder="paste invoice here"
      ></textarea>
      <p>&nbsp; {warning} &nbsp;</p>
      <button
        className="button is-primary"
        disabled={!valid}
        onClick={() => handler(getInvoice())}
      >
        Reedem
      </button>
    </Modal>
  )
}

export default InvoiceModal
