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
import { getContractPriceLevel, getSyntheticQuantity } from 'lib/contracts'

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

  const maxRatio = minRatio + 200

  const setCollateralQuantity = (e: React.ChangeEvent<HTMLInputElement>) => {
    let quantity = toSatoshis(
      parseFloat(e.target.value),
      contract.collateral.precision,
    )
    const collateral = { ...contract.collateral, quantity }
    quantity = getSyntheticQuantity({ ...contract, collateral }, ratio)
    const synthetic = { ...contract.synthetic, quantity }
    setContract({ ...contract, collateral, synthetic })
  }

  const setContractRatio = (newRatio: number) => {
    const ratio = newRatio > minRatio ? newRatio : minRatio
    setRatio(ratio)
    const quantity = getSyntheticQuantity(contract, ratio)
    const synthetic = { ...contract.synthetic, quantity }
    const newContract = { ...contract, synthetic }
    const priceLevel = getContractPriceLevel(newContract, ratio)
    setContract({ ...newContract, priceLevel })
  }

  if (loading) return <Spinner />
  if (!oracles) return <SomeError>Error getting oracles</SomeError>

  return (
    <div className="is-box has-pink-border">
      <h3 className="mt-4">
        <span className="stepper">1</span>
        Deposit your {contract.collateral.ticker}
      </h3>
      <p className="is-size-6 ml-5 mb-4">
        Enter the desired amount of {contract.collateral.ticker} you want to
        multiply.
      </p>
      <Collateral
        asset={contract.collateral}
        setCollateralQuantity={setCollateralQuantity}
      />
      <h3 className="mt-6">
        <span className="stepper">2</span>
        Set a collateral ratio
      </h3>
      <p className="is-size-6 ml-5 mb-4">
        Position will be liquidated below the minimum.
      </p>
      <Range
        liquidationPrice={contract.priceLevel ?? 0}
        minRatio={minRatio}
        maxRatio={maxRatio}
        ratio={ratio}
        setRatio={setContractRatio}
      />
      <h3 className="mt-6">
        <span className="stepper">3</span>
        Select oracle providers
      </h3>
      <p className="is-size-6 ml-5 mb-4">
        You can choose one or more oracles to use to determine the price of the
        collateral.
      </p>
      <Oracles contract={contract} setContract={setContract} />
    </div>
  )
}

export default MultiplyForm
