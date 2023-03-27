import Link from 'next/link'
import { Ticker } from 'lib/types'
import { EnabledTasks, Tasks } from 'lib/tasks'

interface BorrowButtonProps {
  collateral: Ticker
  synthetic: Ticker
}

const BorrowButton = ({ collateral, synthetic }: BorrowButtonProps) => {
  const cN = 'button is-primary is-solid-pink'
  const text = 'Borrow'
  const enabled = EnabledTasks[Tasks.Borrow]
  if (!enabled) {
    return (
      <button disabled className={cN}>
        {text}
      </button>
    )
  }
  return (
    <Link passHref href={`/borrow/${synthetic}/${collateral}`}>
      <button className={cN}>{text}</button>
    </Link>
  )
}

export default BorrowButton
