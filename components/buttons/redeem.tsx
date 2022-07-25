import { contractIsExpired } from 'lib/contracts'
import { prepareRedeemTx } from 'lib/covenant'
import { Contract } from 'lib/types'
import { closeModal, openModal } from 'lib/utils'

interface RedeemButtonProps {
  contract: Contract
  setRedeem: any
}

const RedeemButton = ({ contract, setRedeem }: RedeemButtonProps) => {
  const handleClick = async () => {
    setRedeem(contract)
    openModal('redeem-modal')
    await prepareRedeemTx(contract)
    closeModal('redeem-modal')
  }

  return (
    <button
      onClick={handleClick}
      className="button is-primary ml-3"
      disabled={contractIsExpired(contract)}
    >
      Redeem
    </button>
  )
}

export default RedeemButton
