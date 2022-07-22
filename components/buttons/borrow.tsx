import Link from 'next/link'
import { Ticker } from 'lib/types'

interface BorrowButtonProps {
  collateral: Ticker
  synthetic: Ticker
}

const BorrowButton = ({ collateral, synthetic }: BorrowButtonProps) => {
  return (
    <Link href={`/borrow/${synthetic}/${collateral}`}>
      <a className="button is-primary is-solid-purple">Borrow</a>
    </Link>
  )
}

export default BorrowButton
