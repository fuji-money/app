import { contractIsClosed } from 'lib/contracts'
import { EnabledTasks, Tasks } from 'lib/tasks'
import { Contract } from 'lib/types'
import Link from 'next/link'

interface RenewButtonProps {
  contract: Contract
  size?: string
}

const RenewButton = ({ contract, size }: RenewButtonProps) => {
  const cN = `button is-primary is-solid-pink ml-3 ${
    size === 'small' && 'is-small is-rounded'
  }`
  const text = 'Renew'

  const enabled =
    !contractIsClosed(contract) &&
    contract.confirmed &&
    EnabledTasks[Tasks.Renew]

  return enabled ? (
    <Link passHref href={`/contracts/${contract.txid}/renew/channel`}>
      <button className={cN}>{text}</button>
    </Link>
  ) : (
    <button disabled className={cN}>
      {text}
    </button>
  )
}

export default RenewButton
