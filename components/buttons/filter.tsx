import Link from 'next/link'
import { Ticker } from 'lib/types'
import { EnabledTasks, Tasks } from 'lib/tasks'

interface FilterButtonProps {
  ticker: Ticker
  text?: string
}

const FilterButton = ({ ticker, text = 'Mint' }: FilterButtonProps) => {
  const cN = 'button is-primary ml-3'
  const enabled = EnabledTasks[Tasks.Borrow]
  if (!enabled) {
    return (
      <button disabled className={cN}>
        {text}
      </button>
    )
  }
  return (
    <Link passHref href={`/borrow/${ticker}`}>
      <button className={cN}>{text}</button>
    </Link>
  )
}

export default FilterButton
