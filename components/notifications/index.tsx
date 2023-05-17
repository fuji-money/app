import { Contract } from 'lib/types'
import { useContext, useEffect, useState } from 'react'
import NotEnoughFundsNotification from 'components/notifications/notEnoughFunds'
import NotEnoughOraclesNotification from 'components/notifications/notEnoughOracles'
import RatioTooLowNotification from 'components/notifications/ratioTooLow'
import RatioUnsafeNotification from 'components/notifications/ratioUnsafe'
import BelowDustLimitNotification from './belowDustLimit'
import { feeAmount, minDustLimit } from 'lib/constants'
import { WalletContext } from 'components/providers/wallet'
import ConnectWalletNotification from './connectWallet'
import LowCollateralAmountNotification from './lowCollateralAmount'
import { getAssetBalance } from 'lib/marina'
import { swapDepositAmountOutOfBounds } from 'lib/swaps'
import OutOfBoundsNotification from './outOfBounds'
import { LightningEnabledTasks } from 'lib/tasks'
import { ContractsContext } from 'components/providers/contracts'

interface NotificationsProps {
  contract: Contract
  minRatio: number
  ratio: number
  topup?: number
}

const Notifications = ({
  contract,
  minRatio,
  ratio,
  topup,
}: NotificationsProps) => {
  const [notEnoughFunds, setNotEnoughFunds] = useState(false)
  const [notEnoughOracles, setNotEnoughOracles] = useState(false)
  const [ratioTooLow, setRatioTooLow] = useState(false)
  const [ratioUnsafe, setRatioUnsafe] = useState(false)
  const [belowDustLimit, setBelowDustLimit] = useState(false)
  const [collateralTooLow, setCollateralTooLow] = useState(false)
  const [outOfBounds, setOutOfBounds] = useState(false)

  const { balances, connected, network } = useContext(WalletContext)
  const { assets, loading } = useContext(ContractsContext)

  const { collateral, oracles, payoutAmount } = contract
  const spendQuantity =
    typeof topup === 'undefined' ? collateral.quantity : topup

  useEffect(() => {
    const asset = assets.find((a) => a.ticker === contract.collateral.ticker)
    if (!asset) return
    const balance = getAssetBalance(asset, balances)
    setNotEnoughFunds(connected && spendQuantity > balance)
    setOutOfBounds(swapDepositAmountOutOfBounds(spendQuantity))
    setCollateralTooLow(spendQuantity < feeAmount + minDustLimit)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    setRatioTooLow(ratio < minRatio)
  }, [minRatio, ratio])

  useEffect(() => {
    const safeLimit = (collateral.minCollateralRatio || 0) + 50
    setRatioUnsafe(ratio < safeLimit)
  }, [collateral.minCollateralRatio, ratio])

  useEffect(() => {
    setNotEnoughOracles(oracles?.length === 0)
  }, [oracles])

  useEffect(() => {
    if (payoutAmount) setBelowDustLimit(payoutAmount < minDustLimit)
  }, [payoutAmount])

  return (
    <>
      {ratioUnsafe && <RatioUnsafeNotification />}
      {LightningEnabledTasks.Borrow ? (
        <>
          {notEnoughFunds && <NotEnoughFundsNotification oob={outOfBounds} />}
          {outOfBounds && <OutOfBoundsNotification nef={notEnoughFunds} />}
        </>
      ) : (
        <>{notEnoughFunds && <NotEnoughFundsNotification oob={true} />}</>
      )}
      {!connected && <ConnectWalletNotification />}
      {belowDustLimit && <BelowDustLimitNotification />}
      {collateralTooLow && <LowCollateralAmountNotification />}
      {notEnoughOracles && <NotEnoughOraclesNotification />}
      {ratioTooLow && <RatioTooLowNotification />}
    </>
  )
}

export default Notifications
