import { Contract, ContractState } from 'lib/types'

interface RedeemButtonProps {
  contract: Contract
  setRedeem: any
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
