import { ContractsContext } from 'components/providers/contracts'
import { useContext } from 'react'
import Router from 'next/router'
import { Contract } from 'lib/types'

interface MultiplyButtonProps {
  contract: Contract
}

const MultiplyButton = ({ contract }: MultiplyButtonProps) => {
  const { setNewContract } = useContext(ContractsContext)

  const handleClick = () => {
    setNewContract(contract)
    Router.push(`${Router.router?.asPath}/channel`)
  }

  const enabled = true

  return (
    <button
      className="button is-primary is-cta"
      disabled={!enabled}
      onClick={handleClick}
    >
      Deposit
    </button>
  )
}

export default MultiplyButton
