import Modal, { ModalIds } from './modal'

const MultiplyModals = () => {
  return (
    <>
      <Modal id={ModalIds.LiquidationPrice}>
        <h3 className="mb-5">Liquidation Price</h3>
        <p className="is-size-7 mb-5">
          The Liquidation Price is the price at which a contract becomes
          vulnerable to liquidation.
        </p>
      </Modal>
      <Modal id={ModalIds.CurrentPrice}>
        <h3 className="mb-5">Current Price</h3>
        <p className="is-size-7 mb-5">
          This is the current price of your contract collateral supplied by the
          price oracle.
        </p>
      </Modal>
    </>
  )
}

export default MultiplyModals
