import { contractIsExpired } from 'lib/contracts'
import { prepareRedeemTx } from 'lib/covenant'
import { getBalance } from 'lib/marina'
import { Contract } from 'lib/types'
import { closeModal, openModal } from 'lib/utils'

interface RedeemButtonProps {
  contract: Contract
  setAssetBalance: any
  setRedeem: any
  setStep: any
}

const RedeemButton = ({ contract, setAssetBalance, setRedeem, setStep }: RedeemButtonProps) => {
  const handleClick = async () => {
    setAssetBalance(await getBalance(contract.synthetic))
    setRedeem(contract)
    openModal('redeem-modal')
    await prepareRedeemTx(contract, setStep)
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
