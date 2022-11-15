import { Contract } from 'lib/types'
import Channel from 'components/channel'
import InvoiceDepositModal from 'components/modals/invoiceDeposit'
import MarinaDepositModal from 'components/modals/marinaDeposit'
import { ContractsContext } from 'components/providers/contracts'
import { WalletContext } from 'components/providers/wallet'
import { useContext, useState } from 'react'
import { ModalStages } from 'components/modals/modal'
import EnablersLightning from 'components/enablers/lightning'
import EnablersLiquid from 'components/enablers/liquid'
import { Tasks } from 'lib/tasks'

interface MultiplyDepositProps {
  contract: Contract
  channel: string
  setChannel: (arg0: string) => void
  setDeposit: (arg0: boolean) => void
}

const MultiplyDeposit = ({
  contract,
  channel,
  setChannel,
  setDeposit,
}: MultiplyDepositProps) => {
  const { network } = useContext(WalletContext)
  const { reloadContracts } = useContext(ContractsContext)

  const [data, setData] = useState('')
  const [invoice, setInvoice] = useState('')
  const [paid, setPaid] = useState(false)
  const [result, setResult] = useState('')
  const [stage, setStage] = useState(ModalStages.NeedsCoins)
  const [useWebln, setUseWebln] = useState(false)

  const lightning = channel === 'lightning'
  const liquid = channel === 'liquid'

  const resetDeposit = () => {
    setChannel('')
    setDeposit(false)
  }

  const handleLightning = async () => {} // TODO
  const handleAlby = async () => await handleLightning()
  const handleMarina = () => {} // TODO

  return (
    <>
      <div className="is-box has-pink-border p-6">
        {!channel && <Channel contract={contract} task={Tasks.Multiply} />}
        {lightning && (
          <EnablersLightning
            contract={contract}
            handleAlby={handleAlby}
            handleInvoice={handleLightning}
            task={Tasks.Multiply}
          />
        )}
        {liquid && (
          <EnablersLiquid
            contract={contract}
            handleMarina={handleMarina}
            task={Tasks.Multiply}
          />
        )}
      </div>
      <MarinaDepositModal
        contract={contract}
        data={data}
        result={result}
        reset={resetDeposit}
        retry={() => {}}
        stage={stage}
        task={Tasks.Multiply}
      />
      <InvoiceDepositModal
        contract={contract}
        data={data}
        invoice={invoice}
        result={result}
        reset={resetDeposit}
        retry={() => {}}
        stage={stage}
        task={Tasks.Multiply}
        useWebln={useWebln}
      />
    </>
  )
}

export default MultiplyDeposit
