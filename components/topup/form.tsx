import { Contract, Oracle } from 'lib/types'
import { getCollateralQuantity } from 'lib/utils'
import Ratio from 'components/borrow/ratio'
import Summary from './summary'
import { Dispatch, SetStateAction } from 'react'
import Oracles from 'components/oracles'

interface FormProps {
  contract: Contract
  oracles: Oracle[]
  ratio: number
  setContract: Dispatch<SetStateAction<Contract>>
  setRatio: Dispatch<SetStateAction<number>>
}

const Form = ({
  contract,
  oracles,
  ratio,
  setContract,
  setRatio,
}: FormProps) => {
  const quantity = getCollateralQuantity(contract, ratio)
  const collateral = { ...contract.collateral, quantity }
  const future = { ...contract, collateral }

  const setContractOracles = (oracles: string[]) => {
    setContract({ ...contract, oracles })
  }

  return (
    <div className="is-box">
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
        Select oracle provider
      </h3>
      <Oracles
        contract={contract}
        oracles={oracles}
        setContractOracles={setContractOracles}
      />
    </div>
  )
}

export default Form
