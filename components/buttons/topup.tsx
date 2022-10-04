import Link from 'next/link'
import { Contract } from 'lib/types'
import { contractIsClosed } from 'lib/contracts'
import { EnabledTasks, Tasks } from 'lib/tasks'

interface TopupButtonProps {
  contract: Contract
}

const TopupButton = ({ contract }: TopupButtonProps) => {
  const cN = 'button ml-3'
  const text = EnabledTasks[Tasks.Topup] ? 'Topup' : 'Topup (coming soon)'
  const enabled =
    !contractIsClosed(contract) &&
    contract.confirmed &&
    EnabledTasks[Tasks.Topup]
  if (!enabled) {
    return (
      <button disabled className={cN}>
        {text}
      </button>
    )
  }
  return (
    <Link passHref href={`/contracts/${contract.txid}/topup`}>
      <button className={cN}>{text}</button>
    </Link>
  )
}

export default TopupButton
