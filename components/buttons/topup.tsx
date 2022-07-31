import Link from 'next/link'
import { Contract, ContractState } from 'lib/types'
import { contractIsExpired } from 'lib/contracts'

interface TopupButtonProps {
  contract: Contract
}

const TopupButton = ({ contract }: TopupButtonProps) => {
  if (contractIsExpired(contract)) {
    return (
      <button className="button ml-3" disabled>
        Topup
      </button>
    )
  }
  return (
    <Link passHref href={`/contracts/${contract.txid}/topup`}>
      <button disabled className="button ml-3">Topup (Coming soon)</button>
    </Link>
  )
}

export default TopupButton
