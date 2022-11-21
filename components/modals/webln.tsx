import { WalletContext } from 'components/providers/wallet'
import { useContext } from 'react'
import Modal, { ModalIds } from './modal'

const WeblnModal = () => {
  const { enableWeblnHandler } = useContext(WalletContext)
  return (
    <Modal id={ModalIds.Webln}>
      <h3 className="mt-4">WebLN provider detected</h3>
      <button className="button is-primary" onClick={enableWeblnHandler}>
        Enable it
      </button>
    </Modal>
  )
}

export default WeblnModal
