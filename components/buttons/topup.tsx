import Link from 'next/link'
import { Contract } from 'lib/types'
import { contractIsClosed } from 'lib/contracts'

interface TopupButtonProps {
  contract: Contract
}

const TopupButton = ({ contract }: TopupButtonProps) => {
  const cN = 'button ml-3'
  const text = 'Topup (Coming Soon)'
  if (contractIsClosed(contract) || !contract.confirmed) {
    return (
      <button disabled className={cN}>
        {text}
      </button>
    )
  }
  return (
    <Link passHref href={`/contracts/${contract.txid}/topup`}>
      <button disabled className={cN}>
        {text}
      </button>
    </Link>
  )
}

export default TopupButton
