import { ContractsContext } from 'components/providers/contracts'
import { WalletContext } from 'components/providers/wallet'
import { contractIsClosed, redeemContract } from 'lib/contracts'
import { prepareRedeemTx } from 'lib/covenant'
import { getAssetBalance } from 'lib/marina'
import { Contract } from 'lib/types'
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
  const { updateContracts } = useContext(ContractsContext)

  const handleClick = async () => {
    setAssetBalance(getAssetBalance(contract.synthetic, balances))
    setRedeem(contract)
    openModal('redeem-modal')
    try {
      const txid = await prepareRedeemTx(contract, setStep)
      redeemContract(contract)
      updateContracts()
      setData(txid)
      setResult('success')
    } catch (error) {
      setData(error instanceof Error ? error.message : error)
      setResult('failure')
    }
    closeModal('redeem-modal')
  }

  return (
    <button
      onClick={handleClick}
      className="button is-primary ml-3"
      disabled={contractIsClosed(contract) || !contract.confirmed}
    >
      Redeem
    </button>
  )
}

export default RedeemButton
