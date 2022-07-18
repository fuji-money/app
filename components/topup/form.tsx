import { Contract, Oracle } from 'lib/types'
import { getCollateralQuantity } from 'lib/contracts'
import Ratio from 'components/borrow/ratio'
import Summary from './summary'
import Oracles from 'components/oracles'

interface TopupFormProps {
  contract: Contract
  oracles: Oracle[]
  ratio: number
  setContract: any
  setRatio: any
}

const TopupForm = ({
  contract,
  oracles,
  ratio,
  setContract,
  setRatio,
}: TopupFormProps) => {
  const quantity = getCollateralQuantity(contract, ratio)
  const collateral = { ...contract.collateral, quantity }
  const future = { ...contract, collateral }

  return (
    <div className="is-box has-pink-border">
      <h3 className="mt-4">
        <span className="stepper">1</span>
        Your present contract
      </h3>
      <Summary contract={contract} />
      <h3 className="mt-6">
        <span className="stepper">2</span>
        Set your new collateral ratio
      </h3>
      <Ratio
        collateral={contract.collateral}
        ratio={ratio}
        setContractRatio={setRatio}
      />
      <h3 className="mt-6">
        <span className="stepper">3</span>
        Confirm new values
      </h3>
      <Summary contract={future} />
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

export default TopupForm
