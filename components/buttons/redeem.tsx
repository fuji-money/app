import { contractIsClosed } from 'lib/contracts'
import { EnabledTasks, Tasks } from 'lib/tasks'
import { Contract } from 'lib/types'
import Link from 'next/link'

interface RedeemButtonProps {
  contract: Contract
}

const RedeemButton = ({ contract }: RedeemButtonProps) => {
  const cN = 'button is-primary ml-3'
  const text = 'Close'
  const enabled =
    !contractIsClosed(contract) &&
    contract.confirmed &&
    EnabledTasks[Tasks.Redeem]
  if (!enabled) {
    return (
      <button disabled className={cN}>
        {text}
      </button>
    )
  }
  return (
    <Link passHref href={`/contracts/${contract.txid}/close/channel`}>
      <button className={cN}>{text}</button>
    </Link>
  )
}

export default RedeemButton
