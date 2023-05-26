import { useContext, useEffect, useState } from 'react'
import {
  getCollateralQuantity,
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
import { ConfigContext } from 'components/providers/config'

const Topup = () => {
  const { config } = useContext(ConfigContext)
  const { newContract, oldContract, setNewContract } =
    useContext(ContractsContext)

  const [ratio, setRatio] = useState(
    getContractRatio(newContract ?? oldContract),
  )

  const { oracles } = config

  useEffect(() => {
    if (newContract) {
      const quantity = getCollateralQuantity(newContract, ratio)
      const collateral = { ...newContract.collateral, quantity }
      const priceLevel = getContractPriceLevel(newContract, ratio)
      setNewContract({ ...newContract, collateral, priceLevel })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ratio])

  if (!newContract) return <SomeError>Contract not found</SomeError>
  if (!oldContract) return <SomeError>Contract not found</SomeError>

  const minRatio = getContractRatio(oldContract)
  const topupAmount =
    newContract.collateral.quantity - oldContract.collateral.quantity

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
              <Notifications
                contract={newContract}
                minRatio={minRatio}
                ratio={ratio}
                topup={topupAmount}
              />
            </>
          </div>
          <div className="column is-4">
            <TopupInfo newContract={newContract} oldContract={oldContract} />
            <TopupButton
              oracles={newContract.oracles}
              minRatio={minRatio}
              ratio={ratio}
              topup={topupAmount}
            />
          </div>
        </div>
      </div>
    </section>
  )
}

export default Topup
