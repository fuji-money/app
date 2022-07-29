import { WalletContext } from 'components/providers/wallet'
import { minDustLimit } from 'lib/constants'
import { Contract } from 'lib/types'
import { useContext } from 'react'

interface BorrowButtonProps {
  contract: Contract
  minRatio: number
  ratio: number
  setDeposit: any
}

const BorrowButton = ({
  contract,
  minRatio,
  ratio,
  setDeposit,
}: BorrowButtonProps) => {
  const { wallet } = useContext(WalletContext)

  const enabled =
    wallet &&
    contract.collateral.quantity &&
    contract.collateral.quantity > 0 &&
    contract.collateral.value > 0 &&
    ratio >= minRatio &&
    contract.synthetic.quantity &&
    contract.synthetic.quantity > 0 &&
    contract.synthetic.value > 0 &&
    contract.oracles &&
    contract.oracles.length > 0 &&
    contract.payoutAmount &&
    contract.payoutAmount >= minDustLimit

  return (
    <div className="has-text-centered">
      <button
        className="button is-primary is-cta"
        disabled={!enabled}
        onClick={() => setDeposit(true)}
      >
        Proceed to deposit
      </button>
    </div>
  )
}

export default BorrowButton
