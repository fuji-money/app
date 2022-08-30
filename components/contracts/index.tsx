import { useState } from 'react'
import ContractsHeader from './header'
import ContractsList from './list'

const Contracts = () => {
  const [showActive, setShowActive] = useState(true)

  return (
    <section>
      <ContractsHeader showActive={showActive} setShowActive={setShowActive} />
      <ContractsList showActive={showActive} />
    </section>
  )
}

export default Contracts
