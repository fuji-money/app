import { WalletContext } from 'components/providers/wallet'
import { fetchAsset } from 'lib/api'
import { feeAmount, minDustLimit } from 'lib/constants'
import { Contract } from 'lib/types'
import { useContext, useEffect, useState } from 'react'

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
  const [enoughFunds, setEnoughFunds] = useState(false)

  useEffect(() => {
    fetchAsset(contract.collateral.ticker).then((asset) => {
      const funds = asset?.quantity || 0
      const needed = contract.collateral.quantity || 0
      setEnoughFunds(wallet && funds > needed)
    })
  })

  const enabled =
    wallet &&
    enoughFunds &&
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
    contract.payoutAmount >= minDustLimit &&
    contract.collateral.quantity > contract.payoutAmount + feeAmount + minDustLimit

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
