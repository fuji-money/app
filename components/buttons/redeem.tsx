import { Contract } from 'lib/types'
import { Dispatch, SetStateAction } from 'react'

interface RedeemButtonProps {
  contract: Contract
  setRedeem: Dispatch<SetStateAction<Contract>>
}

const RedeemButton = ({ contract, setRedeem }: RedeemButtonProps) => {
  return (
    <button
      onClick={() => setRedeem(contract)}
      className="button is-primary ml-3"
    >
      Redeem
    </button>
  )
}

export default RedeemButton
