import { ModalStages } from 'components/modals/modal'
import { ContractsContext } from 'components/providers/contracts'
import { WalletContext } from 'components/providers/wallet'
import { markContractRedeemed } from 'lib/contracts'
import { prepareRedeemTx } from 'lib/covenant'
import { getAssetBalance } from 'lib/marina'
import { Contract, ContractState } from 'lib/types'
import { extractError, openModal } from 'lib/utils'
import { useContext } from 'react'

interface RedeemButtonProps {
  contract: Contract
  setAssetBalance: (arg0: number) => void
  setData: (arg0: string) => void
  setRedeem: (arg0: Contract) => void
  setResult: (arg0: string) => void
  setStage: (arg0: string[]) => void
}

const RedeemButton = ({
  contract,
  setAssetBalance,
  setData,
  setRedeem,
  setResult,
  setStage,
}: RedeemButtonProps) => {
  const { balances, marina, network } = useContext(WalletContext)
  const { reloadContracts } = useContext(ContractsContext)

  const handleClick = async () => {
    if (!marina) return
    setAssetBalance(getAssetBalance(contract.synthetic, balances))
    setRedeem(contract)
    openModal('redeem-modal')
    try {
      const tx = await prepareRedeemTx(contract, network, setStage)
      setStage(ModalStages.NeedsConfirmation)
      const signed = await tx.unlock()

      setStage(ModalStages.NeedsFinishing)

      // finalize the fuji asset input
      // we skip utxo in position 0 since is finalized already by the redeem function
      for (let index = 1; index < signed.psbt.data.inputs.length; index++) {
        signed.psbt.finalizeInput(index)
      }

      // extract and broadcast transaction
      const rawHex = signed.psbt.extractTransaction().toHex()
      const txid = (await marina.broadcastTransaction(rawHex)).txid

      markContractRedeemed(contract)
      setData(txid)
      setResult('success')
      reloadContracts()
    } catch (error) {
      console.debug(extractError(error))
      setData(extractError(error))
      setResult('failure')
    }
  }

  const disabled =
    !contract.confirmed ||
    contract.state === ContractState.Liquidated ||
    contract.state === ContractState.Redeemed ||
    contract.state === ContractState.Topup

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
