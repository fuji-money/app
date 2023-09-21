import { ConfigContext } from 'components/providers/config'
import { ContractsContext } from 'components/providers/contracts'
import { WalletContext } from 'components/providers/wallet'
import { feeAmount, minDustLimit } from 'lib/constants'
import { getAssetBalance } from 'lib/marina'
import { swapDepositAmountOutOfBounds } from 'lib/swaps'
import { LightningEnabledTasks, Tasks } from 'lib/tasks'
import { Contract } from 'lib/types'
import { fromSatoshis } from 'lib/utils'
import Router from 'next/router'
import { useContext, useEffect, useState } from 'react'

interface BorrowButtonProps {
  contract: Contract
  minRatio: number
  ratio: number
}

const BorrowButton = ({ contract, minRatio, ratio }: BorrowButtonProps) => {
  const { balances, connected } = useContext(WalletContext)
  const { config } = useContext(ConfigContext)
  const { setNewContract } = useContext(ContractsContext)

  const [enoughFunds, setEnoughFunds] = useState(false)
  const [mintLimitReached, setMintLimitReached] = useState(false)

  const { collateral, oracles, synthetic } = contract

  const { assets } = config

  useEffect(() => {
    const asset = assets.find((a) => a.ticker === contract.collateral.ticker)
    if (!asset) return
    const funds = getAssetBalance(asset, balances)
    const needed = contract.collateral.quantity
    const enoughFundsOnMarina = connected && funds > needed
    if (LightningEnabledTasks[Tasks.Borrow]) {
      const outOfBounds = swapDepositAmountOutOfBounds(needed)
      setEnoughFunds(enoughFundsOnMarina || !outOfBounds)
    } else {
      setEnoughFunds(enoughFundsOnMarina)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contract.collateral.quantity])

  const handleClick = () => {
    setNewContract(contract)
    Router.push(`${Router.router?.asPath}/channel`)
  }

  useEffect(() => {
    const { circulating, quantity, maxCirculatingSupply, precision } = synthetic
    const cur = circulating ?? 0
    const max = maxCirculatingSupply
    const qty = fromSatoshis(quantity, precision)
    setMintLimitReached(!max ? false : cur === max || cur + qty > max)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contract.synthetic.quantity])

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
    collateral.quantity > feeAmount + minDustLimit &&
    !mintLimitReached

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
