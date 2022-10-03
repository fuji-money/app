import { useContext, useEffect, useState } from 'react'
import {
  getCollateralQuantity,
  getContractPayoutAmount,
  getContractPriceLevel,
  getContractRatio,
} from 'lib/contracts'
import TopupForm from './form'
import Balance from 'components/balance'
import TopupButton from './button'
import Title from 'components/title'
import Notifications from 'components/notifications'
import TopupInfo from './info'
import { ContractsContext } from 'components/providers/contracts'
import SomeError from 'components/layout/error'

const Topup = () => {
  const { newContract, oldContract, oracles, setNewContract } =
    useContext(ContractsContext)

  const [ratio, setRatio] = useState(0)
  const [topup, setTopup] = useState(0)

  if (oldContract) setRatio(getContractRatio(oldContract))

  useEffect(() => {
    console.log('use effect')
    if (newContract && oldContract) {
      const oldQuantity = oldContract.collateral.quantity
      const newQuantity = getCollateralQuantity(newContract, ratio)
      const collateral = { ...newContract.collateral, quantity: newQuantity }
      const priceLevel = getContractPriceLevel(newContract.collateral, ratio)
      const payoutAmount = getContractPayoutAmount(newContract, newQuantity)
      setNewContract({ ...newContract, collateral, priceLevel, payoutAmount })
      setTopup(newQuantity - oldQuantity)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ratio])

  if (!newContract || !oldContract)
    return <SomeError>Contract not found</SomeError>

  const minRatio = getContractRatio(oldContract)

  return (
    <section>
      <Title title="Topup" />
      <div className="row">
        <div className="columns">
          <div className="column is-8">
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
              <TopupInfo newContract={newContract} oldContract={oldContract} />
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
                topup={topup}
              />
            </>
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
