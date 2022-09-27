import {
  getInvoiceExpireDate,
  getInvoiceValue,
  submarineSwapBoltzFees,
} from 'lib/swaps'
import { fromSatoshis, toSatoshis } from 'lib/utils'
import { useState } from 'react'
import Modal from './modal'

interface InvoiceModalProps {
  amount: number
  handler: (arg0: string) => void
}

const InvoiceModal = ({ amount, handler }: InvoiceModalProps) => {
  const [valid, setValid] = useState(false)
  const [warning, setWarning] = useState('')

  const newAmount = amount - submarineSwapBoltzFees(amount)

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
      if (toSatoshis(getInvoiceValue(invoice)) !== newAmount) {
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

  return (
    <Modal id={'invoice-modal'}>
      <h3 className="mt-4">Enter BOLT11 Lightning Invoice</h3>
      <p>Amount: {fromSatoshis(newAmount, 8)}</p>
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
