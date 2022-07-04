import { Contract } from 'lib/types'
import { fetchAsset } from 'lib/api'
import { useEffect, useState } from 'react'
import NotEnoughFundsNotification from 'components/notifications/notEnoughFunds'
import NotEnoughOraclesNotification from 'components/notifications/notEnoughOracles'
import RatioTooLowNotification from 'components/notifications/ratioTooLow'
import RatioUnsafeNotification from 'components/notifications/ratioUnsafe'
import BorrowFeeNotification from './borrowFee'

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

  const spendQuantity = topup ? topup : contract.collateral.quantity || 0
  const { payout } = contract

  useEffect(() => {
    fetchAsset(contract.collateral.ticker).then((asset) => {
      const quantity = spendQuantity * Math.pow(10, asset.precision)
      if (asset?.quantity) setNotEnoughFunds(quantity > asset.quantity)
    })
  }, [contract.collateral.ticker, spendQuantity])

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

  return (
    <>
      {notEnoughFunds && <NotEnoughFundsNotification />}
      {notEnoughOracles && <NotEnoughOraclesNotification />}
      <BorrowFeeNotification payout={payout} />
      {ratioTooLow && <RatioTooLowNotification />}
      {ratioUnsafe && <RatioUnsafeNotification />}
    </>
  )
}

export default Notifications
