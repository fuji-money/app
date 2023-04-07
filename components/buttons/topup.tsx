import Link from 'next/link'
import { Contract } from 'lib/types'
import { contractIsClosed } from 'lib/contracts'
import { EnabledTasks, Tasks } from 'lib/tasks'

interface TopupButtonProps {
  contract: Contract
  size: string
}

const TopupButton = ({ contract, size }: TopupButtonProps) => {
  const cN = `button ml-3 ${size === 'small' && 'is-small is-rounded'}`
  const text = EnabledTasks[Tasks.Topup]
    ? 'Manage Collateral'
    : 'Manage Collateral (soon)'

  const enabled =
    !contractIsClosed(contract) &&
    contract.confirmed &&
    EnabledTasks[Tasks.Topup]

  return enabled ? (
    <Link passHref href={`/contracts/${contract.txid}/topup`}>
      <button className={cN}>{text}</button>
    </Link>
  ) : (
    <button disabled className={cN}>
      {text}
    </button>
  )
}

export default TopupButton
