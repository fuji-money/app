import { useState } from 'react'
import ContractsHeader from './header'
import ContractsList from './list'

interface ContractsProps {
  setData: (arg0: string) => void
  setResult: (arg0: string) => void
}

const Contracts = ({ setData, setResult }: ContractsProps) => {
  const [showActive, setShowActive] = useState(true)

  return (
    <section>
      <ContractsHeader showActive={showActive} setShowActive={setShowActive} />
      <ContractsList
        showActive={showActive}
        setData={setData}
        setResult={setResult}
      />
    </section>
  )
}

export default Contracts
