import Oracles from 'components/oracles'
import { Contract, Oracle } from 'lib/types'
import { getCollateralQuantity } from 'lib/utils'
import Collateral from './collateral'
import Ratio from './ratio'
import Synthetic from './synthetic'

interface BorrowFormProps {
  contract: Contract
  oracles: Oracle[]
  ratio: number
  setContract: any
  setRatio: any
}

const BorrowForm = ({
  contract,
  oracles,
  ratio,
  setContract,
  setRatio,
}: BorrowFormProps) => {
  const { collateral, synthetic } = contract

  const setSyntheticQuantity = (e: React.ChangeEvent<HTMLInputElement>) => {
    let quantity = parseFloat(e.target.value)
    const synthetic = { ...contract.synthetic, quantity }
    quantity = getCollateralQuantity({ ...contract, synthetic }, ratio)
    const collateral = { ...contract.collateral, quantity }
    setContract({ ...contract, collateral, synthetic })
  }

  const setContractRatio = (ratio: number) => {
    setRatio(ratio)
    const quantity = getCollateralQuantity(contract, ratio)
    const collateral = { ...contract.collateral, quantity }
    setContract({ ...contract, collateral })
  }

  return (
    <div className="is-box">
      <h3 className="mt-4">
        <span className="stepper">1</span>
        How much {synthetic.ticker} you want to borrow?
      </h3>
      <p className="is-size-6 ml-5 mb-4">Lorem ipsum dolor</p>
      <Synthetic
        asset={synthetic}
        setSyntheticQuantity={setSyntheticQuantity}
      />
      <h3 className="mt-6">
        <span className="stepper">2</span>
        Set a collateral ratio
      </h3>
      <p className="is-size-6 ml-5 mb-4">Lorem ipsum dolor</p>
      <Ratio
        collateral={collateral}
        ratio={ratio}
        setContractRatio={setContractRatio}
      />
      <h3 className="mt-6">
        <span className="stepper">3</span>
        Confirm collateral amount
      </h3>
      <p className="is-size-6 ml-5 mb-4">Lorem ipsum dolor</p>
      <Collateral asset={collateral} />
      <h3 className="mt-6">
        <span className="stepper">4</span>
        Select oracle providers
      </h3>
      <p className="is-size-6 ml-5 mb-4">
        Gravida sed gravida in rhoncus enim. Nullam vitae at.
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
