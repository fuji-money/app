import { Contract } from 'lib/types'
import Marina from 'components/receive/marina'
import Channel from 'components/receive/channel'
import Swap from 'components/receive/swap'
import { ContractsContext } from 'components/providers/contracts'
import { WalletContext } from 'components/providers/wallet'
import { useContext, useState } from 'react'
import { markContractRedeemed } from 'lib/contracts'
import { prepareRedeemTx } from 'lib/covenant'
import { openModal, extractError } from 'lib/utils'
import { ModalStages } from 'components/modals/modal'
import RedeemModal from 'components/modals/redeem'

interface RedeemReceiveProps {
  channel: string
  contract: Contract
  setChannel: (arg0: string) => void
}

const RedeemReceive = ({
  channel,
  contract,
  setChannel,
}: RedeemReceiveProps) => {
  const { marina, network } = useContext(WalletContext)
  const { reloadContracts } = useContext(ContractsContext)

  const [data, setData] = useState('')
  const [result, setResult] = useState('')
  const [stage, setStage] = useState(ModalStages.NeedsInvoice)

  const lightning = channel === 'lightning'
  const liquid = channel === 'liquid'

  const { txid, collateral } = contract

  // validate contracts
  if (!txid) throw new Error('Contract without txid')
  if (!collateral.quantity)
    throw new Error('Contract without collateral quantity')
  if (!collateral.quantity)
    throw new Error('Contract without collateral quantity')

  const reset = () => {
    setChannel('')
  }

  const handleLightning = async (): Promise<void> => {
    if (!marina) return
    openModal('redeem-modal')
    setStage(ModalStages.NeedsInvoice)
    try {
    } catch (error) {
      setData(extractError(error))
      setResult('failure')
    }
  }

  const handleMarina = async () => {
    if (!marina) return
    openModal('redeem-modal')
    setStage(ModalStages.NeedsCoins)
    try {
      const address = (await marina.getNextAddress()).confidentialAddress
      const tx = await prepareRedeemTx(address, contract, network, setStage)
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

  return (
    <>
      <div className="is-box has-pink-border p-6">
        {!channel && <Channel contract={contract} setChannel={setChannel} />}
        {lightning && <Swap contract={contract} handler={handleLightning} />}
        {liquid && <Marina contract={contract} handler={handleMarina} />}
      </div>
      <RedeemModal
        contract={contract}
        data={data}
        result={result}
        reset={reset}
        stage={stage}
      />
    </>
  )
}

export default RedeemReceive
