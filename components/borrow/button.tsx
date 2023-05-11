import { ContractsContext } from 'components/providers/contracts'
import { WalletContext } from 'components/providers/wallet'
import { fetchAsset } from 'lib/api'
import { feeAmount, minDustLimit } from 'lib/constants'
import { getAssetBalance } from 'lib/marina'
import { swapDepositAmountOutOfBounds } from 'lib/swaps'
import { LightningEnabledTasks } from 'lib/tasks'
import { Contract } from 'lib/types'
import Router from 'next/router'
import { useContext, useEffect, useState } from 'react'

interface BorrowButtonProps {
  contract: Contract
  minRatio: number
  ratio: number
}

const BorrowButton = ({ contract, minRatio, ratio }: BorrowButtonProps) => {
  const { setNewContract } = useContext(ContractsContext)
  const { balances, connected, network } = useContext(WalletContext)
  const [enoughFunds, setEnoughFunds] = useState(false)
  const { collateral, oracles, synthetic } = contract

  useEffect(() => {
    fetchAsset(contract.collateral.ticker, network).then((asset) => {
      const funds = getAssetBalance(asset, balances)
      const needed = contract.collateral.quantity
      const enoughFundsOnMarina = connected && funds > needed
      if (LightningEnabledTasks.Borrow) {
        const outOfBounds = swapDepositAmountOutOfBounds(needed)
        setEnoughFunds(enoughFundsOnMarina || !outOfBounds)
      } else {
        setEnoughFunds(enoughFundsOnMarina)
      }
    })
  })

  const handleClick = () => {
    setNewContract(contract)
    Router.push(`${Router.router?.asPath}/channel`)
  }

  const enabled =
    connected &&
    enoughFunds &&
    collateral.quantity > 0 &&
    collateral.value > 0 &&
    ratio >= minRatio &&
    synthetic.quantity > 0 &&
    synthetic.value > 0 &&
    oracles &&
    oracles.length > 0 &&
    collateral.quantity > feeAmount + minDustLimit

  return (
    <div className="has-text-centered">
      <button
        className="button is-primary is-cta"
        disabled={!enabled}
        onClick={handleClick}
      >
        Proceed to deposit
      </button>
    </div>
  )
}

export default BorrowButton
