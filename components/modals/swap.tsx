import Spinner from 'components/spinner'
import Modal from './modal'

const SwapModal = () => {
  return (
    <Modal id="swap-modal">
      <>
        <Spinner />
        <h3 className="mt-4">Claim transaction</h3>
        <p className="confirm">
          Confirm this transaction in your Marina wallet
        </p>
      </>
    </Modal>
  )
}

export default SwapModal
