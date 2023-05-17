import Modal, { ModalIds } from './modal'

const MintLimitModal = () => {
  return (
    <Modal id={ModalIds.MintLimit}>
      <h3 className="mb-5">Limit reached</h3>
      <p className="is-size-7">Current maximum borrowing limit is reached</p>
      <p className="is-size-7 mb-5">Please come back later</p>
    </Modal>
  )
}

export default MintLimitModal
