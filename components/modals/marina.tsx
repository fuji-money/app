import Modal from './modal'

const MarinaModal = () => {
  return (
    <Modal id="marina-modal">
      <h3 className="mt-4">⚠️</h3>
      <h3 className="mt-4">Outdated Marina</h3>
      <p>You need Marina version 0.4.10 or above</p>
    </Modal>
  )
}

export default MarinaModal
