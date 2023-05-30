import { Contract, Offer } from 'lib/types'
import MultiplyForm from './form'
import { useContext, useEffect, useState } from 'react'
import MultiplyButton from './button'
import Title from 'components/title'
import Notifications from 'components/notifications'
import { getContractExpirationDate } from 'lib/contracts'
import { minMultiplyRatio } from 'lib/constants'
import { ContractsContext } from 'components/providers/contracts'
import SomeError from 'components/layout/error'
import { ConfigContext } from 'components/providers/config'
import Spinner from 'components/spinner'
import { fromSatoshis, toSatoshis } from 'lib/utils'
import MultiplyInfo from './info'

interface MultiplyProps {
  offer: Offer
}

const Multiply = ({ offer }: MultiplyProps) => {
  const { config } = useContext(ConfigContext)
  const { loading } = useContext(ContractsContext)
  const { oracles } = config

  const minRatio = offer.synthetic.minCollateralRatio || minMultiplyRatio

  const [contract, setContract] = useState<Contract>({
    ...offer,
    expirationDate: getContractExpirationDate(),
  })
  const [ratio, setRatio] = useState(200)

  const [values, setValues] = useState({
    exposure: 0,
    multiple: 0,
  })

  // update multiply values (exposure and multiply)
  useEffect(() => {
    let exposure = 0
    let multiple = 0
    const { collateral, synthetic } = contract
    if (collateral.value) {
      const quantity = fromSatoshis(collateral.quantity, collateral.precision)
      const fujiDebt = fromSatoshis(synthetic.quantity, synthetic.precision)
      exposure = fujiDebt / collateral.value + quantity
      multiple = quantity ? exposure / quantity : 0
    }
    setValues({
      exposure: toSatoshis(exposure, collateral.precision),
      multiple,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contract.collateral.quantity, ratio])

  if (loading) return <Spinner />
  if (!oracles) return <SomeError>Error getting oracles</SomeError>

  return (
    <section>
      <Title title="Multiply" />
      <div className="row">
        <div className="columns">
          <div className="column is-8">
            <MultiplyForm
              contract={contract}
              minRatio={minRatio}
              ratio={ratio}
              setContract={setContract}
              setRatio={setRatio}
            />
          </div>
          <div className="column is-4">
            <MultiplyInfo contract={contract} values={values} />
            <Notifications
              contract={contract}
              minRatio={minRatio}
              ratio={ratio}
            />
            <MultiplyButton
              contract={contract}
              minRatio={minRatio}
              ratio={ratio}
            />
          </div>
        </div>
      </div>
    </section>
  )
}

export default Multiply
