import Modal from './modal'

const InvalidEmailModal = () => {
  return (
    <Modal id="invalid-email-modal">
      <h3 className="mt-4">It&apos;s Not your turn (yet)</h3>
      <p>Email has not been granted access to closed beta</p>
      <p>
        <a href="https://fuji.money" target="_blank" rel="noreferrer">
          Check your position
        </a>{' '}
        and keep sharing your link to your friends
      </p>
    </Modal>
  )
}

export default InvalidEmailModal
