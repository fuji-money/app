import { ContractsContext } from 'components/providers/contracts'
import { WalletContext } from 'components/providers/wallet'
import { markContractRedeemed } from 'lib/contracts'
import { prepareRedeemTx } from 'lib/covenant'
import { getAssetBalance } from 'lib/marina'
import { Contract, ContractState } from 'lib/types'
import { closeModal, debugMessage, extractError, openModal } from 'lib/utils'
import { useContext } from 'react'

interface RedeemButtonProps {
  contract: Contract
  setAssetBalance: (arg0: number) => void
  setRedeem: (arg0: Contract) => void
  setStep: (arg0: number) => void
  setData: (arg0: string) => void
  setResult: (arg0: string) => void
}

const RedeemButton = ({
  contract,
  setAssetBalance,
  setRedeem,
  setStep,
  setData,
  setResult,
}: RedeemButtonProps) => {
  const { balances } = useContext(WalletContext)
  const { reloadContracts } = useContext(ContractsContext)

  const handleClick = async () => {
    setAssetBalance(getAssetBalance(contract.synthetic, balances))
    setRedeem(contract)
    openModal('redeem-modal')
    try {
      const txid = await prepareRedeemTx(contract, setStep)
      markContractRedeemed(contract)
      setData(txid)
      setResult('success')
      reloadContracts()
    } catch (error) {
      debugMessage(extractError(error))
      setData(extractError(error))
      setResult('failure')
    }
  }

  const disabled =
    !contract.confirmed ||
    contract.state === ContractState.Liquidated ||
    contract.state === ContractState.Redeemed ||
    contract.state === ContractState.Unknown

  return (
    <button
      onClick={handleClick}
      className="button is-primary ml-3"
      disabled={disabled}
    >
      Redeem
    </button>
  )
}

export default RedeemButton
