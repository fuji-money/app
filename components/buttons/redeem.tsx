import { contractIsExpired } from 'lib/contracts'
import { prepareRedeemTx } from 'lib/covenant'
import { getBalance } from 'lib/marina'
import { redeemContractToStorage } from 'lib/storage'
import { Contract } from 'lib/types'
import { closeModal, openModal } from 'lib/utils'

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
  const handleClick = async () => {
    setAssetBalance(await getBalance(contract.synthetic))
    setRedeem(contract)
    openModal('redeem-modal')
    try {
      const txid = await prepareRedeemTx(contract, setStep)
      redeemContractToStorage(contract)
      setData(txid)
      setResult('success')
    } catch(error) {
      setData(error)
      setResult('failure')
    }
    closeModal('redeem-modal')
  }

  return (
    <button
      onClick={handleClick}
      className="button is-primary ml-3"
      disabled={contractIsExpired(contract)}
    >
      Redeem
    </button>
  )
}

export default RedeemButton
