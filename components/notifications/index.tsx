import { Contract } from 'lib/types'
import { fetchAsset } from 'lib/api'
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
import { LightningEnabledTasks, Tasks } from 'lib/tasks'

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

  const { collateral, oracles, payoutAmount } = contract
  const spendQuantity =
    typeof topup === 'undefined' ? collateral.quantity : topup

  useEffect(() => {
    fetchAsset(collateral.ticker, network).then((asset) => {
      const balance = getAssetBalance(asset, balances)
      setNotEnoughFunds(connected && spendQuantity > balance)
      setOutOfBounds(swapDepositAmountOutOfBounds(spendQuantity))
      setCollateralTooLow(spendQuantity < feeAmount + minDustLimit)
    })
  }, [
    balances,
    connected,
    collateral.ticker,
    network,
    payoutAmount,
    spendQuantity,
  ])

  useEffect(() => {
    setRatioTooLow(ratio < minRatio)
  }, [minRatio, ratio])

  useEffect(() => {
    const safeLimit = (collateral.ratio || 0) + 50
    setRatioUnsafe(ratio < safeLimit)
  }, [collateral.ratio, ratio])

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
