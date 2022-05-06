import Link from 'next/link'
import { Ticker } from 'lib/types'

interface MultiplyButtonProps {
  ticker: Ticker
}

const MultiplyButton = ({ ticker }: MultiplyButtonProps) => {
  return (
    <Link href={`/multiply/${ticker}`}>
      <a className="button ml-3">Multiply</a>
    </Link>
  )
}

export default MultiplyButton
