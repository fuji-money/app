import { Contract } from 'lib/types'
import { fetchAsset } from 'lib/api'
import { useEffect, useState } from 'react'
import NotEnoughFundsNotification from 'components/notifications/notEnoughFunds'
import RatioTooLowNotification from 'components/notifications/ratioTooLow'
import RatioUnsafeNotification from 'components/notifications/ratioUnsafe'

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
  const [ratioTooLow, setRatioTooLow] = useState(false)
  const [ratioUnsafe, setRatioUnsafe] = useState(false)

  const spendQuantity = topup ? topup : contract.collateral.quantity || 0

  useEffect(() => {
    fetchAsset(contract.collateral.ticker).then((asset) => {
      if (asset?.quantity) setNotEnoughFunds(spendQuantity > asset.quantity)
    })
  }, [contract.collateral.ticker, spendQuantity])

  useEffect(() => {
    setRatioTooLow(ratio < minRatio)
  }, [minRatio, ratio])

  useEffect(() => {
    const safeLimit = (contract.collateral.ratio || 0) + 50
    setRatioUnsafe(ratio < safeLimit)
  }, [contract.collateral.ratio, ratio])

  return (
    <>
      {notEnoughFunds && <NotEnoughFundsNotification />}
      {ratioTooLow && <RatioTooLowNotification />}
      {ratioUnsafe && <RatioUnsafeNotification />}
    </>
  )
}

export default Notifications
