import Spinner from 'components/spinner'
import Modal, { ModalIds } from './modal'
import { marinaFujiAccountID } from 'lib/constants'

const AccountModal = () => {
  return (
    <Modal id={ModalIds.Account}>
      <Spinner />
      <h3 className="mt-4">Waiting for confirmation...</h3>
      <p>
        Creating a Marina account named <strong>{marinaFujiAccountID}</strong>
      </p>
      <p>Please accept and unlock on Marina</p>
    </Modal>
  )
}

export default AccountModal
