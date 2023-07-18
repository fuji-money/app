import DropDown from 'components/dropdown'
import { ContractsContext } from 'components/providers/contracts'
import { WalletContext } from 'components/providers/wallet'
import { NetworkString } from 'marina-provider'
import { useContext } from 'react'

const NetworkButton: React.FC = () => {
  const { network, setNetwork } = useContext(WalletContext)
  const { reloadContracts } = useContext(ContractsContext)

  return (
    <DropDown
      title={network || 'network'}
      options={['liquid', 'testnet'].map((net) => ({
        isActive: net === network,
        value: net,
        onClick: async () => {
          await setNetwork(net as NetworkString)
          await reloadContracts()
        },
      }))}
    />
  )
}

export default NetworkButton
