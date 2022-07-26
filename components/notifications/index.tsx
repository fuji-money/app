import { Contract } from 'lib/types'
import { fetchAsset } from 'lib/api'
import { useEffect, useState } from 'react'
import NotEnoughFundsNotification from 'components/notifications/notEnoughFunds'
import NotEnoughOraclesNotification from 'components/notifications/notEnoughOracles'
import RatioTooLowNotification from 'components/notifications/ratioTooLow'
import RatioUnsafeNotification from 'components/notifications/ratioUnsafe'
import BorrowFeeNotification from './borrowFee'
import { getContractPayout } from 'lib/contracts'
import BelowDustLimitNotification from './belowDustLimit'

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

  const spendQuantity = topup ? topup : contract.collateral.quantity || 0
  const { payout } = contract

  useEffect(() => {
    fetchAsset(contract.collateral.ticker).then((asset) => {
      const funds = asset?.quantity || 0
      setNotEnoughFunds(spendQuantity > funds)
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

  useEffect(() => {
    const dustLimit = 300
    setBelowDustLimit(getContractPayout(contract) < dustLimit)
  }, [contract])

  return (
    <>
      {notEnoughFunds && <NotEnoughFundsNotification />}
      {notEnoughOracles && <NotEnoughOraclesNotification />}
      {belowDustLimit && <BelowDustLimitNotification />}
      <BorrowFeeNotification payout={payout} />
      {ratioTooLow && <RatioTooLowNotification />}
      {ratioUnsafe && <RatioUnsafeNotification />}
    </>
  )
}

export default Notifications
