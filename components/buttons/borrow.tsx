import Link from 'next/link'
import { Ticker } from 'lib/types'

interface BorrowButtonProps {
  collateral: Ticker
  synthetic: Ticker
}

const BorrowButton = ({ collateral, synthetic }: BorrowButtonProps) => {
  return (
    <Link href={`/borrow/${synthetic}/${collateral}`}>
      <a className="button">Borrow</a>
    </Link>
  )
}

export default BorrowButton
