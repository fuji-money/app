import { ReactNode } from 'react'

const closeModals = () => {
  const modals = document.querySelectorAll('.modal') || []
  modals.forEach((modal) => {
    modal.classList.remove('is-active')
  })
}

export enum ModalIds {
  Account = 'account-modal',
  CurrentPrice = 'current-price-modal',
  Invoice = 'invoice-modal',
  InvoiceDeposit = 'invoice-deposit-modal',
  LiquidationPrice = 'liquidation-price-modal',
  MarinaDeposit = 'marina-deposit-modal',
  MintLimit = 'mint-limit-modal',
  Redeem = 'redeem-modal',
  Wallets = 'wallets-modal',
  Webln = 'webln-modal',
}

export enum ModalStages {
  NeedsAddress = 'NeedAddress',
  NeedsCoins = 'NeedsCoins',
  NeedsConfirmation = 'NeedsConfirmation',
  NeedsFinishing = 'NeedsFinishing',
  NeedsFujiApproval = 'NeedsFujiApproval',
  NeedsInvoice = 'NeedsInvoice',
  NeedsPayment = 'NeedsPayment',
  PaymentReceived = 'PaymentReceived',
  ShowResult = 'ShowResult',
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
      <div onClick={handleClick} className="modal-background" />
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
          padding: 2rem;
        }
      `}</style>
    </div>
  )
}

export default Modal
