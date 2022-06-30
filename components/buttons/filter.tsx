import Link from 'next/link'
import { Ticker } from 'lib/types'

interface FilterButtonProps {
  ticker: Ticker
}

const FilterButton = ({ ticker }: FilterButtonProps) => {
  return (
    <Link href={`/borrow/${ticker}`}>
      <a className="button is-primary is-solid-purple ml-3">Borrow</a>
    </Link>
  )
}

export default FilterButton
