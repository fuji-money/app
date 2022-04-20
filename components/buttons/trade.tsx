import { openModal } from 'lib/utils'

const TradeButton = () => {
  return (
    <button
      onClick={() => openModal('trade-modal')}
      className="button"
    >
      Trade
    </button>
  )
}

export default TradeButton
