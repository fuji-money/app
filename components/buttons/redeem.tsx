import { contractIsExpired } from 'lib/contracts'
import { Contract, ContractState } from 'lib/types'

interface RedeemButtonProps {
  contract: Contract
  setRedeem: any
}

const RedeemButton = ({ contract, setRedeem }: RedeemButtonProps) => {
  return (
    <button
      onClick={() => setRedeem(contract)}
      className="button is-primary ml-3"
      disabled={contractIsExpired(contract)}
    >
      Redeem
    </button>
  )
}

export default RedeemButton
