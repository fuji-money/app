import { getInvoiceExpireDate, getInvoiceValue } from 'lib/swaps'
import { toSatoshis } from 'lib/utils'
import { useState } from 'react'
import Modal from './modal'

interface InvoiceModalProps {
  amount: number
  handler: (arg0: string) => void
}

const InvoiceModal = ({ amount, handler }: InvoiceModalProps) => {
  const [valid, setValid] = useState(false)
  const [warning, setWarning] = useState('')

  const getInvoice = (): string =>
    (document.getElementById('invoice') as HTMLInputElement).value

  const validateInvoice = (): void => {
    const invoice = getInvoice()
    if (!invoice) {
      setWarning('')
      return setValid(false)
    }
    try {
      if (toSatoshis(getInvoiceValue(invoice)) !== amount) {
        setWarning('Invalid amount on invoice')
        return setValid(false)
      }
      if (getInvoiceExpireDate(invoice) < Date.now()) {
        setWarning('Invalid expire date on invoice')
        return setValid(false)
      }
    } catch (_) {
      setWarning('Invalid invoice')
      return setValid(false)
    }
    setWarning('')
    setValid(true)
  }

  const handleClick = (): void => handler(getInvoice())

  return (
    <Modal id={'invoice-modal'}>
      <h3 className="mt-4">Enter BOLT11 Lightning Invoice</h3>
      <p>Amount: {amount}</p>
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
        onClick={handleClick}
      >
        Reedem
      </button>
    </Modal>
  )
}

export default InvoiceModal
