import { useContext, useEffect, useState } from 'react'
import { contractIsExpired, getContracts } from 'lib/contracts'
import { Contract } from 'lib/types'
import EmptyState from 'components/layout/empty'
import RedeemModal from 'components/modals/redeem'
import { WalletContext } from 'components/providers/wallet'
import ContractRow from './row'
import Spinner from 'components/spinner'

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

  const { connected, fujiCoins } = useContext(WalletContext)

  useEffect(() => {
    console.log('fujiCoins')
    setLoading(true)
    getContracts().then((contracts) => {
      setContracts(contracts)
      setLoading(false)
    })
  }, [fujiCoins])

  if (!connected)
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
