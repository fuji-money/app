import Link from 'next/link'
import { Contract } from 'lib/types'
import { contractIsClosed } from 'lib/contracts'

interface TopupButtonProps {
  contract: Contract
}

const TopupButton = ({ contract }: TopupButtonProps) => {
  if (contractIsClosed(contract) || !contract.confirmed) {
    return <button className="button ml-3">Topup</button>
  }
  return (
    <Link passHref href={`/contracts/${contract.txid}/topup`}>
      <button className="button ml-3">Topup</button>
    </Link>
  )
}

export default TopupButton
