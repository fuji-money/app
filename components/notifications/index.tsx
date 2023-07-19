import { Contract } from 'lib/types'
import { useContext, useEffect, useState } from 'react'
import NotEnoughFundsNotification from 'components/notifications/notEnoughFunds'
import NotEnoughOraclesNotification from 'components/notifications/notEnoughOracles'
import RatioTooLowNotification from 'components/notifications/ratioTooLow'
import RatioUnsafeNotification from 'components/notifications/ratioUnsafe'
import BelowDustLimitNotification from './belowDustLimit'
import { feeAmount, minDustLimit, safeBorrowMargin } from 'lib/constants'
import { WalletContext } from 'components/providers/wallet'
import ConnectWalletNotification from './connectWallet'
import LowCollateralAmountNotification from './lowCollateralAmount'
import { getAssetBalance } from 'lib/marina'
import { swapDepositAmountOutOfBounds } from 'lib/swaps'
import OutOfBoundsNotification from './outOfBounds'
import { LightningEnabledTasks, Tasks } from 'lib/tasks'
import { ConfigContext } from 'components/providers/config'
import MintLimitReachedNotification from './mintLimitReached'
import { fromSatoshis } from 'lib/utils'
import { WalletType } from 'lib/wallet'

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
  const { wallets, balances } = useContext(WalletContext)
  const { config } = useContext(ConfigContext)

  const [belowDustLimit, setBelowDustLimit] = useState(false)
  const [collateralTooLow, setCollateralTooLow] = useState(false)
  const [outOfBounds, setOutOfBounds] = useState(false)
  const [mintLimitReached, setMintLimitReached] = useState(false)
  const [notEnoughFunds, setNotEnoughFunds] = useState<WalletType[]>([])
  const [notEnoughOracles, setNotEnoughOracles] = useState(false)
  const [ratioTooLow, setRatioTooLow] = useState(false)
  const [ratioUnsafe, setRatioUnsafe] = useState(false)

  const { assets } = config

  const { collateral, oracles, synthetic } = contract
  const spendQuantity =
    typeof topup === 'undefined' ? collateral.quantity : topup

  useEffect(() => {
    const asset = assets.find((a) => a.ticker === collateral.ticker)
    if (!asset) return

    for (const wallet of wallets) {
      const balance = getAssetBalance(asset, balances[wallet.type])
      if (spendQuantity > balance) {
        setNotEnoughFunds((prev) => Array.from(new Set([...prev, wallet.type])))
      }
    }

    setOutOfBounds(swapDepositAmountOutOfBounds(spendQuantity))
    setCollateralTooLow(spendQuantity < feeAmount + minDustLimit)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contract.synthetic.quantity])

  useEffect(() => {
    const asset = assets.find((a) => a.ticker === synthetic.ticker)
    if (!asset) return
    if (asset.maxCirculatingSupply) {
      const cur = asset.circulating ?? 0
      const max = asset.maxCirculatingSupply
      const qty = fromSatoshis(synthetic.quantity, asset.precision)
      setMintLimitReached(cur === max || cur + qty > max)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contract.synthetic.quantity])

  useEffect(() => {
    setRatioTooLow(ratio < minRatio)
  }, [minRatio, ratio])

  useEffect(() => {
    const safeLimit = (synthetic.minCollateralRatio ?? 0) + safeBorrowMargin
    setRatioUnsafe(ratio < safeLimit)
  }, [synthetic.minCollateralRatio, ratio])

  useEffect(() => {
    setNotEnoughOracles(oracles?.length === 0)
  }, [oracles])

  if (!spendQuantity) return <></>

  const notEnoughFundsNotifications = (
    <>
      {notEnoughFunds.map((wallet, index) => (
        <NotEnoughFundsNotification key={index} wallet={wallet} oob={true} />
      ))}
    </>
  )

  return (
    <>
      {ratioUnsafe && <RatioUnsafeNotification />}
      {LightningEnabledTasks[Tasks.Borrow] ? (
        <>
          {outOfBounds && <OutOfBoundsNotification nef={outOfBounds} />}
          {notEnoughFunds && notEnoughFundsNotifications}
        </>
      ) : (
        <>{notEnoughFunds && notEnoughFundsNotifications}</>
      )}
      {!wallets.length && <ConnectWalletNotification />}
      {belowDustLimit && <BelowDustLimitNotification />}
      {collateralTooLow && <LowCollateralAmountNotification />}
      {notEnoughOracles && <NotEnoughOraclesNotification />}
      {ratioTooLow && <RatioTooLowNotification />}
      {mintLimitReached && <MintLimitReachedNotification />}
    </>
  )
}

export default Notifications
