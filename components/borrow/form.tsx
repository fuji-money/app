import Oracles from 'components/oracles'
import { Contract, Oracle } from 'lib/types'
import {
  getCollateralQuantity,
  getContractPayoutAmount,
  getContractPriceLevel,
} from 'lib/contracts'
import Collateral from './collateral'
import Ratio from './ratio'
import Synthetic from './synthetic'
import { toSatoshis } from 'lib/utils'

interface BorrowFormProps {
  contract: Contract
  minRatio: number
  oracles: Oracle[]
  ratio: number
  setContract: (arg0: Contract) => void
  setRatio: (arg0: number) => void
}

const BorrowForm = ({
  contract,
  minRatio,
  oracles,
  ratio,
  setContract,
  setRatio,
}: BorrowFormProps) => {
  const { collateral, synthetic } = contract

  const setSyntheticQuantity = (e: React.ChangeEvent<HTMLInputElement>) => {
    let quantity = toSatoshis(parseFloat(e.target.value))
    const synthetic = { ...contract.synthetic, quantity }
    quantity = getCollateralQuantity({ ...contract, synthetic }, ratio)
    const collateral = { ...contract.collateral, quantity }
    const payoutAmount = getContractPayoutAmount(contract, quantity)
    setContract({ ...contract, collateral, synthetic, payoutAmount })
  }

  const setContractRatio = (newRatio: number) => {
    newRatio = newRatio > minRatio ? newRatio : minRatio
    setRatio(newRatio)
    const quantity = getCollateralQuantity(contract, newRatio)
    const collateral = { ...contract.collateral, quantity }
    const priceLevel = getContractPriceLevel(contract.collateral, newRatio)
    const payoutAmount = getContractPayoutAmount(contract, quantity)
    setContract({ ...contract, collateral, priceLevel, payoutAmount })
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
        collateral={collateral}
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
      <Oracles
        contract={contract}
        oracles={oracles}
        setContract={setContract}
      />
    </div>
  )
}

export default BorrowForm
