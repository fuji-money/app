import { Contract } from 'lib/types'
import { getCollateralQuantity } from 'lib/utils'
import Ratio from 'components/borrow/ratio'
import Summary from './summary'
import { Dispatch, SetStateAction } from 'react'

const getContractWithTopup = (contract: Contract, quantity = 0) => {
  return {
    ...contract,
    collateral: {
      ...contract.collateral,
      quantity: (contract.collateral.quantity || 0) + quantity,
    },
  }
}
interface FormProps {
  contract: Contract
  ratio: number
  setRatio: Dispatch<SetStateAction<number>>
}

const Form = ({ contract, ratio, setRatio }: FormProps) => {
  const quantity = getCollateralQuantity(contract, ratio)
  const collateral = { ...contract.collateral, quantity }
  const future = { ...contract, collateral }
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
    </div>
  )
}

export default Form
