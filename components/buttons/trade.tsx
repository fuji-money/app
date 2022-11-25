import { ModalIds } from 'components/modals/modal'
import { openModal } from 'lib/utils'

const TradeButton = () => {
  return (
    <button onClick={() => openModal(ModalIds.Trade)} className="button">
      Trade
    </button>
  )
}

export default TradeButton
