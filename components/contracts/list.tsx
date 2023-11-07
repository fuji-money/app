import { useContext, useEffect, useState } from 'react'
import { contractIsClosed } from 'lib/contracts'
import { Contract } from 'lib/types'
import EmptyState from 'components/layout/empty'
import { WalletContext } from 'components/providers/wallet'
import ContractRow from './row'
import Spinner from 'components/spinner'
import { ContractsContext } from 'components/providers/contracts'

interface ContractsListProps {
  showActive: boolean
}

const ContractsList = ({ showActive }: ContractsListProps) => {
  const { wallets, initializing } = useContext(WalletContext)
  const { contracts, loading } = useContext(ContractsContext)

  const [filteredContracts, setFilteredContracts] = useState<Contract[]>([])

  useEffect(() => {
    setFilteredContracts(
      contracts.filter((contract) =>
        showActive ? !contractIsClosed(contract) : contractIsClosed(contract),
      ),
    )
  }, [contracts, showActive])

  if (loading || initializing) return <Spinner />
  if (wallets.length === 0)
    return (
      <EmptyState>🔌 Connect your wallet to view your contracts</EmptyState>
    )
  if (!contracts) return <EmptyState>Error getting contracts</EmptyState>
  if (filteredContracts.length === 0)
    return <EmptyState>No contracts yet</EmptyState>

  return (
    <>
      {filteredContracts &&
        filteredContracts.map((contract: Contract, index: number) => (
          <ContractRow key={index} contract={contract} />
        ))}
    </>
  )
}

export default ContractsList
