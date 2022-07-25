import { useContext, useEffect, useState } from 'react'
import { contractIsExpired, getContracts } from 'lib/contracts'
import { Contract } from 'lib/types'
import { openModal } from 'lib/utils'
import EmptyState from 'components/layout/empty'
import RedeemModal from 'components/modals/redeem'
import { WalletContext } from 'components/providers/wallet'
import ContractRow from './row'
import Spinner from 'components/spinner'
import { NetworkContext } from 'components/providers/network'

interface ContractsListProps {
  showActive: boolean
}

const ContractsList = ({ showActive }: ContractsListProps) => {
  const [isLoading, setLoading] = useState(false)
  const [contracts, setContracts] = useState<Contract[]>()

  const [redeem, setReedem] = useState<Contract>()
  if (redeem) openModal('redeem-modal')

  const { network } = useContext(NetworkContext)
  const { wallet } = useContext(WalletContext)

  const resetReedem = (c: Contract) => {
    setReedem(undefined)
    setReedem(c)
  }

  useEffect(() => {
    setLoading(true)
    getContracts().then((data) => {
      setContracts(data)
      setLoading(false)
    })
  }, [wallet, network])

  if (!wallet)
    return (
      <EmptyState>🔌 Connect your wallet to view your contracts</EmptyState>
    )
  if (isLoading) return <Spinner />
  if (!contracts) return <EmptyState>Error getting contracts</EmptyState>

  const filteredContracts = contracts.filter((contract) =>
    showActive
      ? !contractIsExpired(contract)
      : contractIsExpired(contract),
  )
  if (filteredContracts.length === 0)
    return <EmptyState>No contracts yet</EmptyState>

  return (
    <>
      <RedeemModal contract={redeem} />
      {filteredContracts &&
        filteredContracts.map((contract: Contract, index: number) => (
          <ContractRow key={index} contract={contract} setRedeem={resetReedem} />
        ))}
    </>
  )
}

export default ContractsList
