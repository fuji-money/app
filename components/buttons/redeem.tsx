import { contractIsClosed } from 'lib/contracts'
import { Contract } from 'lib/types'
import Link from 'next/link'

interface RedeemButtonProps {
  contract: Contract
}

const RedeemButton = ({ contract }: RedeemButtonProps) => {
  const cN = 'button is-primary ml-3'
  const text = 'Redeem'
  if (contractIsClosed(contract) || !contract.confirmed) {
    return (
      <button disabled className={cN}>
        {text}
      </button>
    )
  }
  return (
    <Link passHref href={`/contracts/${contract.txid}/redeem/channel`}>
      <button className={cN}>{text}</button>
    </Link>
  )
}

export default RedeemButton
