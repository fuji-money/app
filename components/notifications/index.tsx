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
import { lightningSwapAmountOutOfBounds } from 'lib/swaps'
import OutOfBoundsNotification from './outOfBounds'
import { LightningEnabledTasks, Tasks } from 'lib/tasks'
import { ConfigContext } from 'components/providers/config'
import MintLimitReachedNotification from './mintLimitReached'
import { fromSatoshis } from 'lib/utils'
import TdexErrorNotification from './tdexError'

interface NotificationsProps {
  contract: Contract
  minRatio: number
  ratio: number
  tdexError?: string
  topup?: number
}

const Notifications = ({
  contract,
  minRatio,
  ratio,
  tdexError,
  topup,
}: NotificationsProps) => {
  const { balances, connected } = useContext(WalletContext)
  const { config } = useContext(ConfigContext)

  const [belowDustLimit, setBelowDustLimit] = useState(false)
  const [collateralTooLow, setCollateralTooLow] = useState(false)
  const [outOfBounds, setOutOfBounds] = useState(false)
  const [mintLimitReached, setMintLimitReached] = useState(false)
  const [notEnoughFunds, setNotEnoughFunds] = useState(false)
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
    const balance = getAssetBalance(asset, balances)
    setNotEnoughFunds(connected && spendQuantity > balance)
    setOutOfBounds(lightningSwapAmountOutOfBounds(spendQuantity))
    setCollateralTooLow(spendQuantity < feeAmount + minDustLimit)
    setBelowDustLimit(spendQuantity < minDustLimit)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contract.collateral.quantity])

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

  return (
    <>
      {ratioUnsafe && <RatioUnsafeNotification />}
      {LightningEnabledTasks[Tasks.Borrow] ? (
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
      {mintLimitReached && <MintLimitReachedNotification />}
      {tdexError && <TdexErrorNotification error={tdexError} />}
    </>
  )
}

export default Notifications
