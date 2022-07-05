import { Contract } from 'lib/types'
import Summary from 'components/contract/summary'
import Spinner from 'components/spinner'
import Modal from './modal'
import { redeemContract } from 'lib/contracts'
import { closeModal } from 'lib/utils'

interface RedeemModalProps {
  contract: Contract | undefined
}

const RedeemModal = ({ contract }: RedeemModalProps) => {
  const modalId = 'redeem-modal'
  const handleConfirmation = () => {
    if (contract) {
      redeemContract(contract)
      closeModal(modalId)
    }
  }
  return (
    <Modal id={modalId}>
      {contract && (
        <>
          <Spinner />
          <h3 className="mt-4">Waiting for confirmation...</h3>
          <p>Redeem contract:</p>
          <Summary contract={contract} />
          <p className="confirm" onClick={handleConfirmation}>
            Confirm this transaction in your Marina wallet
          </p>
        </>
      )}
    </Modal>
  )
}

export default RedeemModal
