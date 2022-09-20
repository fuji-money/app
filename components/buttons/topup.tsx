import Link from 'next/link'
import { Contract } from 'lib/types'
import { contractIsClosed } from 'lib/contracts'

interface TopupButtonProps {
  contract: Contract
}

const TopupButton = ({ contract }: TopupButtonProps) => {
  const cN = 'button ml-3'
  if (contractIsClosed(contract) || !contract.confirmed) {
    return (
      <button disabled className={cN}>
        Topup
      </button>
    )
  }
  return (
    <Link passHref href={`/contracts/${contract.txid}/topup`}>
      <button className={cN}>Topup</button>
    </Link>
  )
}

export default TopupButton
