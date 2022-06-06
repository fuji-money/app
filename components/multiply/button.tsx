import { Dispatch, SetStateAction } from 'react'

interface MultiplyButtonProps {
  setDeposit: any
}

const MultiplyButton = ({ setDeposit }: MultiplyButtonProps) => {
  const enabled = true

  return (
    <button
      className="button is-primary is-cta"
      disabled={!enabled}
      onClick={() => setDeposit(true)}
    >
      Deposit
    </button>
  )
}

export default MultiplyButton
