import { useContext } from 'react'
import Range from './range'
import Collateral from './collateral'
import { Contract } from 'lib/types'
import Spinner from 'components/spinner'
import SomeError from 'components/layout/error'
import Oracles from 'components/oracles'
import { ContractsContext } from 'components/providers/contracts'
import { ConfigContext } from 'components/providers/config'
import { toSatoshis } from 'lib/utils'
import {
  getCollateralQuantity,
  getContractPriceLevel,
  getSyntheticQuantity,
} from 'lib/contracts'

interface MultiplyFormProps {
  contract: Contract
  minRatio: number
  ratio: number
  setContract: (arg0: Contract) => void
  setRatio: (arg0: number) => void
}

const MultiplyForm = ({
  contract,
  minRatio,
  ratio,
  setContract,
  setRatio,
}: MultiplyFormProps) => {
  const { config } = useContext(ConfigContext)
  const { loading } = useContext(ContractsContext)
  const { oracles } = config

  console.log('contract', contract)

  const maxRatio = minRatio + 200

  const setCollateralQuantity = (e: React.ChangeEvent<HTMLInputElement>) => {
    let quantity = toSatoshis(
      parseFloat(e.target.value),
      contract.collateral.precision,
    )
    console.log('called', quantity)
    const collateral = { ...contract.collateral, quantity }
    quantity = getSyntheticQuantity({ ...contract, collateral }, ratio)
    console.log('getSyntheticQuantity', quantity)
    const synthetic = { ...contract.synthetic, quantity }
    setContract({ ...contract, collateral, synthetic })
  }

  const setContractRatio = (newRatio: number) => {
    const ratio = newRatio > minRatio ? newRatio : minRatio
    setRatio(ratio)
    const quantity = getCollateralQuantity(contract, ratio)
    const collateral = { ...contract.collateral, quantity }
    const priceLevel = getContractPriceLevel(contract.collateral, ratio)
    setContract({ ...contract, collateral, priceLevel })
  }

  if (loading) return <Spinner />
  if (!oracles) return <SomeError>Error getting oracles</SomeError>

  return (
    <div className="is-box has-pink-border">
      <p className="has-text-weight-bold">Configure your vault</p>
      <p className="is-size-7 mt-5">
        In vivamus mi pretium pharetra cursus lacus, elit. Adipiscing eget vel
        ut non duis vitae. Augue mi, bibendum ac imperdiet ipsum sed ornare.
        Facilisis id sem quam elementum euismod ante ut.
      </p>
      <p className="has-text-weight-bold mt-6 mb-4">Deposit your L-BTC</p>
      <Collateral
        asset={contract.collateral}
        setCollateralQuantity={setCollateralQuantity}
      />
      <p className="has-text-weight-bold mt-6 mb-4">Adjust your multiply</p>
      <Range
        liquidationPrice={contract.priceLevel ?? 0}
        minRatio={minRatio}
        maxRatio={maxRatio}
        ratio={ratio}
        setRatio={setContractRatio}
      />
      <p className="has-text-weight-bold mt-5 mb-4">Choose oracle providers</p>
      <Oracles contract={contract} setContract={setContract} />
    </div>
  )
}

export default MultiplyForm
