import Modal from './modal'

const InvalidEmailModal = () => {
  return (
    <Modal id="invalid-email-modal">
      <h3 className="mt-4">Invalid email</h3>
      <p>Email not in the list of allowed emails for closed beta</p>
      <p>Soon will be open to everyone</p>
    </Modal>
  )
}

export default InvalidEmailModal
