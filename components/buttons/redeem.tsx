import { ContractsContext } from 'components/providers/contracts'
import { WalletContext } from 'components/providers/wallet'
import { markContractRedeemed } from 'lib/contracts'
import { prepareRedeemTx } from 'lib/covenant'
import { getAssetBalance } from 'lib/marina'
import { Contract, ContractState } from 'lib/types'
import { closeModal, openModal } from 'lib/utils'
import { useContext } from 'react'

interface RedeemButtonProps {
  contract: Contract
  setAssetBalance: any
  setRedeem: any
  setStep: any
  setData: any
  setResult: any
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
      reloadContracts()
      setData(txid)
      setResult('success')
    } catch (error) {
      setData(error instanceof Error ? error.message : error)
      setResult('failure')
    }
    closeModal('redeem-modal')
  }

  const disabled =
    !contract.confirmed ||
    contract.state === ContractState.Liquidated ||
    contract.state === ContractState.Redeemed

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
