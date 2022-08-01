import { useContext, useEffect, useState } from 'react'
import { contractIsExpired } from 'lib/contracts'
import { getContractsFromStorage } from 'lib/storage'
import { Contract } from 'lib/types'
import EmptyState from 'components/layout/empty'
import RedeemModal from 'components/modals/redeem'
import { WalletContext } from 'components/providers/wallet'
import ContractRow from './row'
import Spinner from 'components/spinner'
import { NetworkContext } from 'components/providers/network'

interface ContractsListProps {
  showActive: boolean
  setData: any
  setResult: any
}

const ContractsList = ({
  showActive,
  setData,
  setResult,
}: ContractsListProps) => {
  const [isLoading, setLoading] = useState(false)
  const [contracts, setContracts] = useState<Contract[]>()

  const [redeem, setReedem] = useState<Contract>()
  const [assetBalance, setAssetBalance] = useState(0)
  const [step, setStep] = useState(0)

  const { network } = useContext(NetworkContext)
  const { wallet } = useContext(WalletContext)

  useEffect(() => {
    setLoading(true)
    getContractsFromStorage().then((data) => {
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
    showActive ? !contractIsExpired(contract) : contractIsExpired(contract),
  )
  if (filteredContracts.length === 0)
    return <EmptyState>No contracts yet</EmptyState>

  return (
    <>
      <RedeemModal contract={redeem} assetBalance={assetBalance} step={step} />
      {filteredContracts &&
        filteredContracts.map((contract: Contract, index: number) => (
          <ContractRow
            key={index}
            contract={contract}
            setRedeem={setReedem}
            setAssetBalance={setAssetBalance}
            setStep={setStep}
            setData={setData}
            setResult={setResult}
          />
        ))}
    </>
  )
}

export default ContractsList
