import { Contract, Oracle } from 'lib/types'
import { useEffect, useState } from 'react'
import {
  getCollateralQuantity,
  getContractPayoutAmount,
  getContractPriceLevel,
  getContractRatio,
} from 'lib/contracts'
import TopupForm from './form'
import Balance from 'components/balance'
import TopupButton from './button'
import Title from 'components/deposit/title'
import Notifications from 'components/notifications'
import TopupInfo from './info'
import TopupDeposit from './deposit'

interface TopupProps {
  oldContract: Contract
  oracles: Oracle[]
}

const Topup = ({ oldContract, oracles }: TopupProps) => {
  const [newContract, setNewContract] = useState(oldContract)
  const [deposit, setDeposit] = useState(false)
  const [channel, setChannel] = useState('')
  const [ratio, setRatio] = useState(getContractRatio(oldContract))

  useEffect(() => {
    const quantity = getCollateralQuantity(newContract, ratio)
    const collateral = { ...newContract.collateral, quantity }
    const priceLevel = getContractPriceLevel(newContract.collateral, ratio)
    const payoutAmount = getContractPayoutAmount(newContract, quantity)
    setNewContract({ ...newContract, collateral, priceLevel, payoutAmount })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ratio])

  const minRatio = getContractRatio(oldContract)
  const oldQuantity = oldContract.collateral.quantity || 0
  const newQuantity = newContract.collateral.quantity || 0
  const topup = newQuantity - oldQuantity

  return (
    <section>
      <Title name="Topup" channel={channel} deposit={deposit} />
      <div className="row">
        <div className="columns">
          <div className="column is-8">
            {!deposit && (
              <>
                <TopupForm
                  minRatio={minRatio}
                  newContract={newContract}
                  oldContract={oldContract}
                  oracles={oracles}
                  ratio={ratio}
                  setNewContract={setNewContract}
                  setRatio={setRatio}
                />
                <TopupInfo
                  newContract={newContract}
                  oldContract={oldContract}
                />
                <Notifications
                  contract={newContract}
                  minRatio={minRatio}
                  ratio={ratio}
                  topup={topup}
                />
                <TopupButton
                  oracles={newContract.oracles}
                  minRatio={minRatio}
                  ratio={ratio}
                  setDeposit={setDeposit}
                  topup={topup}
                />
              </>
            )}
            {deposit && (
              <TopupDeposit
                channel={channel}
                newContract={newContract}
                oldContract={oldContract}
                setChannel={setChannel}
                setDeposit={setDeposit}
              />
            )}
          </div>
          <div className="column is-4">
            <Balance />
          </div>
        </div>
      </div>
    </section>
  )
}

export default Topup
