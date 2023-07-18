import { ConfigContext } from 'components/providers/config'
import { ContractsContext } from 'components/providers/contracts'
import { WalletContext } from 'components/providers/wallet'
import { feeAmount, minDustLimit } from 'lib/constants'
import { useSelectBalances } from 'lib/hooks'
import { getAssetBalance } from 'lib/marina'
import { swapDepositAmountOutOfBounds } from 'lib/swaps'
import { LightningEnabledTasks, Tasks } from 'lib/tasks'
import { Contract } from 'lib/types'
import { fromSatoshis } from 'lib/utils'
import { WalletType } from 'lib/wallet'
import Router from 'next/router'
import { useContext, useEffect, useState } from 'react'

interface BorrowButtonProps {
  contract: Contract
  minRatio: number
  ratio: number
}

const BorrowButton = ({ contract, minRatio, ratio }: BorrowButtonProps) => {
  const { wallets } = useContext(WalletContext)
  const balances = useSelectBalances(wallets)
  const { config } = useContext(ConfigContext)
  const { setNewContract } = useContext(ContractsContext)

  const [enoughFunds, setEnoughFunds] = useState<WalletType[]>([])
  const [mintLimitReached, setMintLimitReached] = useState(false)

  const { collateral, oracles, synthetic } = contract

  const { assets } = config

  useEffect(() => {
    if (!wallets.length) return
    const asset = assets.find((a) => a.ticker === contract.collateral.ticker)
    if (!asset) return

    for (const wallet of wallets) {
      const balance = getAssetBalance(asset, balances[wallet.type])
      if (contract.collateral.quantity > balance) {
        setEnoughFunds((prev) => [...prev, wallet.type])
      }
    }

    if (LightningEnabledTasks[Tasks.Borrow]) {
      const outOfBounds = swapDepositAmountOutOfBounds(
        contract.collateral.quantity,
      )
      if (outOfBounds) setEnoughFunds([])
    }
  }, [
    assets,
    balances,
    contract.collateral.quantity,
    contract.collateral.ticker,
    wallets,
  ])

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

  const enabled = () =>
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
        disabled={!enabled()}
        onClick={handleClick}
      >
        Proceed to deposit
      </button>
    </div>
  )
}

export default BorrowButton
