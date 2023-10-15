import Oracles from 'components/oracles'
import { Contract } from 'lib/types'
import { getCollateralQuantity, getContractPriceLevel } from 'lib/contracts'
import Collateral from './collateral'
import Ratio from './ratio'
import Synthetic from './synthetic'
import { toSatoshis } from 'lib/utils'

interface BorrowFormProps {
  contract: Contract
  minRatio: number
  ratio: number
  setContract: (arg0: Contract) => void
  setRatio: (arg0: number) => void
}

const BorrowForm = ({
  contract,
  minRatio,
  ratio,
  setContract,
  setRatio,
}: BorrowFormProps) => {
  const { collateral, synthetic } = contract

  const setSyntheticQuantity = (e: React.ChangeEvent<HTMLInputElement>) => {
    let quantity = toSatoshis(
      parseFloat(e.target.value),
      contract.synthetic.precision,
    )
    const synthetic = { ...contract.synthetic, quantity }
    quantity = getCollateralQuantity({ ...contract, synthetic }, ratio)
    const collateral = { ...contract.collateral, quantity }
    setContract({ ...contract, collateral, synthetic })
  }

  const setContractRatio = (ratio: number) => {
    setRatio(ratio)
    const quantity = getCollateralQuantity(contract, ratio)
    const collateral = { ...contract.collateral, quantity }
    const priceLevel = getContractPriceLevel(contract, ratio)
    setContract({ ...contract, collateral, priceLevel })
  }

  return (
    <div className="is-box has-pink-border">
      <h3 className="mt-4">
        <span className="stepper">1</span>
        Amount of {synthetic.ticker}
      </h3>
      <p className="is-size-6 ml-5 mb-4">
        Enter the desired amount of Fuji USD you want to mint.
      </p>
      <Synthetic
        asset={synthetic}
        setSyntheticQuantity={setSyntheticQuantity}
      />
      <h3 className="mt-6">
        <span className="stepper">2</span>
        Set a collateral ratio
      </h3>
      <p className="is-size-6 ml-5 mb-4">
        Position will be liquidated below the minimum.
      </p>
      <Ratio
        contract={contract}
        ratio={ratio}
        setContractRatio={setContractRatio}
      />
      <h3 className="mt-6">
        <span className="stepper">3</span>
        Collateral amount
      </h3>
      <p className="is-size-6 ml-5 mb-4">
        Amount of collateral to be locked in the contract.
      </p>
      <Collateral asset={collateral} />
      <h3 className="mt-6">
        <span className="stepper">4</span>
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

export default BorrowForm
