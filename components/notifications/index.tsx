import { Contract } from 'lib/types'
import { fetchAsset } from 'lib/api'
import { useContext, useEffect, useState } from 'react'
import NotEnoughFundsNotification from 'components/notifications/notEnoughFunds'
import NotEnoughOraclesNotification from 'components/notifications/notEnoughOracles'
import RatioTooLowNotification from 'components/notifications/ratioTooLow'
import RatioUnsafeNotification from 'components/notifications/ratioUnsafe'
import BorrowFeeNotification from './borrowFee'
import BelowDustLimitNotification from './belowDustLimit'
import { feeAmount, minDustLimit } from 'lib/constants'
import { WalletContext } from 'components/providers/wallet'
import ConnectWalletNotification from './connectWallet'
import LowCollateralAmountNotification from './lowCollateralAmount'
import { getAssetBalance } from 'lib/marina'
import { swapDepositAmountOutOfBounds } from 'lib/swaps'
import OutOfBoundsNotification from './outOfBounds'

interface NotificationsProps {
  contract: Contract
  minRatio: number
  ratio: number
  topup: number
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

  const { balances, connected } = useContext(WalletContext)

  const spendQuantity = topup ? topup : contract.collateral.quantity || 0
  const { payout } = contract

  useEffect(() => {
    fetchAsset(contract.collateral.ticker).then((asset) => {
      const balance = getAssetBalance(asset, balances)
      setNotEnoughFunds(connected && spendQuantity > balance)
      setOutOfBounds(swapDepositAmountOutOfBounds(spendQuantity))
      setCollateralTooLow(spendQuantity < feeAmount + minDustLimit)
    })
  }, [
    balances,
    connected,
    contract.collateral.ticker,
    contract.payoutAmount,
    spendQuantity,
  ])

  useEffect(() => {
    setRatioTooLow(ratio < minRatio)
  }, [minRatio, ratio])

  useEffect(() => {
    const safeLimit = (contract.collateral.ratio || 0) + 50
    setRatioUnsafe(ratio < safeLimit)
  }, [contract.collateral.ratio, ratio])

  useEffect(() => {
    setNotEnoughOracles(contract?.oracles?.length === 0)
  }, [contract.oracles])

  useEffect(() => {
    if (contract.payoutAmount)
      setBelowDustLimit(contract.payoutAmount < minDustLimit)
  }, [contract])

  return (
    <>
      {notEnoughOracles && <NotEnoughOraclesNotification />}
      {belowDustLimit && <BelowDustLimitNotification />}
      {!connected && <ConnectWalletNotification />}
      {collateralTooLow && <LowCollateralAmountNotification />}
      {notEnoughFunds && <NotEnoughFundsNotification oob={outOfBounds} />}
      {outOfBounds && <OutOfBoundsNotification nef={notEnoughFunds} />}
      {ratioTooLow && <RatioTooLowNotification />}
      {ratioUnsafe && <RatioUnsafeNotification />}
      <BorrowFeeNotification payout={payout} />
    </>
  )
}

export default Notifications
