import Link from 'next/link'
import { Contract, ContractState } from 'lib/types'

interface TopupButtonProps {
  contract: Contract
  state: ContractState
}

const TopupButton = ({ contract, state }: TopupButtonProps) => {
  if (state === ContractState.Liquidated) {
    return (
      <button className="button ml-3" disabled>
        Topup
      </button>
    )
  }
  return (
    <Link href={`/contracts/${contract.txid}/topup`}>
      <a className="button ml-3">Topup</a>
    </Link>
  )
}

export default TopupButton
