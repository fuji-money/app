import { contractIsClosed } from 'lib/contracts'
import { EnabledTasks, Tasks } from 'lib/tasks'
import { Contract } from 'lib/types'
import Link from 'next/link'

interface RedeemButtonProps {
  contract: Contract
  size?: string
  text?: string
}

const RedeemButton = ({
  contract,
  size,
  text = 'Close',
}: RedeemButtonProps) => {
  const cN = `button is-primary ml-3 ${
    size === 'small' && 'is-small is-rounded'
  }`

  const enabled =
    !contractIsClosed(contract) &&
    contract.confirmed &&
    EnabledTasks[Tasks.Redeem]

  return enabled ? (
    <Link passHref href={`/contracts/${contract.txid}/close/channel`}>
      <button className={cN}>{text}</button>
    </Link>
  ) : (
    <button disabled className={cN}>
      {text}
    </button>
  )
}

export default RedeemButton
