import { ReactNode } from 'react'

const closeModals = () => {
  const modals = document.querySelectorAll('.modal') || []
  modals.forEach((modal) => {
    modal.classList.remove('is-active')
  })
}

export const ModalStages = {
  NeedsAddress: ['Making swap', 'Waiting for address'],
  NeedsCoins: ['Selecting coins', 'Selecting coins needed for transaction'],
  NeedsConfirmation: [
    'Approve transaction',
    'Accept and unlock this transaction in your Marina wallet',
  ],
  NeedsFinishing: ['Finishing', 'Broadcasting transaction'],
  NeedsFujiApproval: ['Preparing transaction', 'Waiting for Fuji approval'],
  NeedsInvoice: ['Making swap', 'Waiting for invoice'],
  NeedsPayment: ['Deposit by scaning this QR', 'Waiting for payment'],
}

interface ModalProps {
  children: ReactNode
  id: string
  reset?: () => void
}

const Modal = ({ children, id, reset }: ModalProps) => {
  const handleClick = () => {
    if (reset) reset()
    closeModals()
  }
  return (
    <div className="modal" id={id}>
      <div onClick={closeModals} className="modal-background" />
      <div className="modal-content">
        <div className="is-box has-pink-border has-text-centered">
          {children}
        </div>
      </div>
      <button
        onClick={handleClick}
        className="modal-close is-large"
        aria-label="close"
      />
      <style jsx>{`
        h3 {
          color: #6b1d9c;
        }
        .modal-content .is-box {
          background: linear-gradient(180deg, #fffbf8 0%, #ffeae5 100%);
        }
      `}</style>
    </div>
  )
}

export default Modal
