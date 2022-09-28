import { Contract } from 'lib/types'
import Marina from 'components/receive/marina'
import Channel from 'components/receive/channel'
import Swap from 'components/receive/swap'
import { ContractsContext } from 'components/providers/contracts'
import { WalletContext } from 'components/providers/wallet'
import { useContext, useState } from 'react'
import { markContractRedeemed } from 'lib/contracts'
import { prepareRedeemTx } from 'lib/covenant'
import { openModal, extractError, closeModal } from 'lib/utils'
import { ModalStages } from 'components/modals/modal'
import RedeemModal from 'components/modals/redeem'
import InvoiceModal from 'components/modals/invoice'
import { createReverseSubmarineSwap, createSubmarineSwap } from 'lib/swaps'
import exp from 'constants'

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

  const { txid, collateral, synthetic, payoutAmount } = contract

  // validate contracts
  if (!txid) throw new Error('Contract without txid')
  if (!payoutAmount) throw new Error('Contract without payoutAmount')
  if (!collateral.quantity)
    throw new Error('Contract without collateral quantity')
  if (!synthetic.quantity)
    throw new Error('Contract without synthetic quantity')

  const amount = collateral.quantity - payoutAmount

  const reset = () => {
    setChannel('')
  }

  const proceedWithRedeem = async (address: string) => {
    if (!marina) return

    // select coins and prepare redeem transaction
    setStage(ModalStages.NeedsCoins)
    const tx = await prepareRedeemTx(address, contract, network, setStage)

    // ask user to sign transaction
    setStage(ModalStages.NeedsConfirmation)
    console.log('tx', tx.psbt.data)
    const signed = await tx.unlock()

    // inform user transaction is finishing
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
  }

  const handleLightning = async (invoice = ''): Promise<void> => {
    if (!marina) return
    if (!invoice) return openModal('invoice-modal')
    closeModal('invoice-modal')
    openModal('redeem-modal')
    try {
      setStage(ModalStages.NeedsAddress)
      const refundPublicKey = (await marina.getNextAddress()).publicKey!
      // create swap with Boltz.exchange
      const boltzSwap = await createSubmarineSwap(
        invoice,
        network,
        refundPublicKey,
      )
      if (!boltzSwap) throw new Error('Error creating swap')
      const { address, expectedAmount, redeemScript } = boltzSwap
      if (expectedAmount > amount)
        throw new Error('Expected amount higher then collateral amount')
      console.log('address', address)
      console.log('expectedAmount', expectedAmount)
      console.log('redeemScript', redeemScript)
      proceedWithRedeem(address)
    } catch (error) {
      console.debug(extractError(error))
      setData(extractError(error))
      setResult('failure')
    }
  }

  const handleMarina = async (): Promise<void> => {
    if (!marina) return
    openModal('redeem-modal')
    try {
      // generate address to receive collateral back,
      const address = (await marina.getNextAddress()).confidentialAddress
      // proceed with redeem
      proceedWithRedeem(address)
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
      <InvoiceModal contract={contract} handler={handleLightning} />
    </>
  )
}

export default RedeemReceive
