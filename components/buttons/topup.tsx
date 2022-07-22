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
    <Link href={`/contracts/${contract.txid}/topup`}>
      <a className="button ml-3">Topup</a>
    </Link>
  )
}

export default TopupButton
