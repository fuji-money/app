import { WeblnContext } from 'components/providers/webln'
import { closeModal } from 'lib/utils'
import { useContext } from 'react'
import Modal, { ModalIds } from './modal'

const WeblnModal = () => {
  const { weblnEnableHandler } = useContext(WeblnContext)
  return (
    <Modal id={ModalIds.Webln}>
      <h3 className="mt-4">WebLN provider detected</h3>
      <p className="mt-6">
        <button className="button" onClick={() => closeModal(ModalIds.Webln)}>
          Close
        </button>
        &nbsp;
        <button className="button is-primary" onClick={weblnEnableHandler}>
          Enable it
        </button>
      </p>
      <p className="confirm">You can enable it later on settings</p>
    </Modal>
  )
}

export default WeblnModal
