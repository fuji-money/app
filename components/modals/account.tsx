import Spinner from 'components/spinner'
import Modal from './modal'

const AccountModal = () => {
  return (
    <Modal id="account-modal">
      <Spinner />
      <h3 className="mt-4">Waiting for confirmation...</h3>
      <p>Creating a Marina account named <strong>fuji</strong></p>
    </Modal>
  )
}

export default AccountModal
