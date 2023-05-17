import { Contract, Oracle } from 'lib/types'
import Ratio from 'components/borrow/ratio'
import Summary from './summary'
import Oracles from 'components/oracles'

interface TopupFormProps {
  minRatio: number
  newContract: Contract
  oldContract: Contract
  oracles: Oracle[]
  ratio: number
  setNewContract: (arg0: Contract) => void
  setRatio: (arg0: number) => void
}

const TopupForm = ({
  minRatio,
  newContract,
  oldContract,
  oracles,
  ratio,
  setNewContract,
  setRatio,
}: TopupFormProps) => {
  // change collateral quantity on new contract based on new ratio
  const setContractRatio = (newRatio: number) => {
    setRatio(newRatio > minRatio ? newRatio : minRatio)
  }

  return (
    <div className="is-box has-pink-border">
      <h3 className="mt-4">
        <span className="stepper">1</span>
        Your present contract
      </h3>
      <Summary contract={oldContract} />
      <h3 className="mt-6">
        <span className="stepper">2</span>
        Set your new collateral ratio
      </h3>
      <Ratio
        collateral={oldContract.collateral}
        minRatio={minRatio}
        ratio={ratio}
        setContractRatio={setContractRatio}
      />
      <h3 className="mt-6">
        <span className="stepper">3</span>
        Confirm new values
      </h3>
      <Summary contract={newContract} />
      <h3 className="mt-6">
        <span className="stepper">4</span>
        Select oracle providers
      </h3>
      <p className="is-size-6 ml-5 mb-4">
        Gravida sed gravida in rhoncus enim. Nullam vitae at.
      </p>
      <Oracles contract={newContract} setContract={setNewContract} />
    </div>
  )
}

export default TopupForm
