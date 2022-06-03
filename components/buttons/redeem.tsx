import { Contract, ContractState } from 'lib/types'
import { Dispatch, SetStateAction } from 'react'

interface RedeemButtonProps {
  contract: Contract
  setRedeem: Dispatch<SetStateAction<Contract | undefined>>
  state: ContractState
}

const RedeemButton = ({ contract, setRedeem, state }: RedeemButtonProps) => {
  return (
    <button
      onClick={() => setRedeem(contract)}
      className="button is-primary ml-3"
      disabled={state === ContractState.Liquidated}
    >
      Redeem
    </button>
  )
}

export default RedeemButton
