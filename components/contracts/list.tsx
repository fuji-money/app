import { useContext, useEffect, useState } from 'react'
import { getContracts } from 'lib/marina'
import { Contract } from 'lib/types'
import { openModal } from 'lib/utils'
import EmptyState from 'components/layout/empty'
import RedeemModal from 'components/modals/redeem'
import { WalletContext } from 'components/providers'
import ContractRow from './row'
import Spinner from 'components/spinner'

interface ContractsListProps {
  showActive: boolean
}

const ContractsList = ({ showActive }: ContractsListProps) => {
  const [isLoading, setLoading] = useState(false)
  const [contracts, setContracts] = useState<Contract[]>()

  const [redeem, setReedem] = useState<Contract>()
  if (redeem) openModal('redeem-modal')

  const { wallet } = useContext(WalletContext)

  useEffect(() => {
    setLoading(true)
    getContracts().then((data) => {
      setContracts(data)
      setLoading(false)
    })
  }, [wallet])

  if (!wallet) return <EmptyState>🔌 Connect your wallet to view your contracts</EmptyState>
  if (isLoading) return <Spinner />
  if (!contracts) return <EmptyState>Error getting contracts</EmptyState>

  const filteredContracts = showActive ? contracts : []
  if (filteredContracts.length === 0)
    return <EmptyState>No contracts yet</EmptyState>

  return (
    <>
      <RedeemModal contract={redeem} />
      {filteredContracts &&
        filteredContracts.map((contract: Contract, index: number) => (
          <ContractRow key={index} contract={contract} setRedeem={setReedem} />
        ))}
    </>
  )
}

export default ContractsList
