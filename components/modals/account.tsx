import Spinner from 'components/spinner'
import Modal, { ModalIds } from './modal'
import { MarinaWallet } from 'lib/marina'

const AccountModal = () => {
  return (
    <Modal id={ModalIds.Account}>
      <Spinner />
      <h3 className="mt-4">Waiting for confirmation...</h3>
      <p>
        Creating a Marina account named{' '}
        <strong>{MarinaWallet.FujiAccountID}</strong>
      </p>
      <p>Please accept and unlock on Marina</p>
    </Modal>
  )
}

export default AccountModal
