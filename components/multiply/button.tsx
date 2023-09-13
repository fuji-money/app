import { ContractsContext } from 'components/providers/contracts'
import { useContext, useEffect, useState } from 'react'
import Router from 'next/router'
import { Contract } from 'lib/types'
import { ConfigContext } from 'components/providers/config'
import { WalletContext } from 'components/providers/wallet'
import { feeAmount, minDustLimit } from 'lib/constants'
import { getAssetBalance } from 'lib/marina'
import { lightningSwapAmountOutOfBounds } from 'lib/swaps'
import { LightningEnabledTasks, Tasks } from 'lib/tasks'
import { fromSatoshis } from 'lib/utils'

interface MultiplyButtonProps {
  contract: Contract
  minRatio: number
  ratio: number
  tdexError: string
}

const MultiplyButton = ({
  contract,
  minRatio,
  ratio,
  tdexError,
}: MultiplyButtonProps) => {
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
    if (LightningEnabledTasks[Tasks.Multiply]) {
      const outOfBounds = lightningSwapAmountOutOfBounds(needed)
      setEnoughFunds(enoughFundsOnMarina || !outOfBounds)
    } else {
      setEnoughFunds(enoughFundsOnMarina)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contract.collateral.quantity])

  useEffect(() => {
    const { circulating, quantity, maxCirculatingSupply, precision } = synthetic
    const cur = circulating ?? 0
    const max = maxCirculatingSupply
    const qty = fromSatoshis(quantity, precision)
    setMintLimitReached(!max ? false : cur === max || cur + qty > max)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contract.synthetic.quantity])

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
    collateral.quantity > feeAmount + minDustLimit &&
    !mintLimitReached &&
    !tdexError

  return (
    <button
      className="button is-primary is-cta"
      disabled={!enabled}
      onClick={handleClick}
    >
      Multiply
    </button>
  )
}

export default MultiplyButton
