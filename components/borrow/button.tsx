import { Contract } from 'lib/types'

interface BorrowButtonProps {
  contract: Contract
  minRatio: number
  ratio: number
  setPay: any
}

const BorrowButton = ({
  contract,
  minRatio,
  ratio,
  setPay,
}: BorrowButtonProps) => {
  const enabled =
    contract.collateral.quantity &&
    contract.collateral.quantity > 0 &&
    contract.collateral.value > 0 &&
    ratio >= minRatio &&
    contract.synthetic.quantity &&
    contract.synthetic.quantity > 0 &&
    contract.synthetic.value > 0

  return (
    <div className="has-text-centered">
      <button
        className="button is-primary is-cta"
        disabled={!enabled}
        onClick={() => setPay(true)}
      >
        Proceed to payment
      </button>
    </div>
  )
}

export default BorrowButton
