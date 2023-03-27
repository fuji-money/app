import Link from 'next/link'
import { Ticker } from 'lib/types'
import { EnabledTasks, Tasks } from 'lib/tasks'

interface FilterButtonProps {
  ticker: Ticker
}

const FilterButton = ({ ticker }: FilterButtonProps) => {
  const cN = 'button is-primary is-solid-pink ml-3'
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
    <Link passHref href={`/borrow/${ticker}`}>
      <button className={cN}>{text}</button>
    </Link>
  )
}

export default FilterButton
