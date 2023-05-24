import type { NextPage } from 'next'
import { useContext, useState } from 'react'
import SomeError from 'components/layout/error'
import { EnabledTasks, Tasks } from 'lib/tasks'
import { ContractsContext } from 'components/providers/contracts'
import NotAllowed from 'components/messages/notAllowed'
import EnablersLightning from 'components/enablers/lightning'
import InvoiceDepositModal from 'components/modals/invoiceDeposit'
import InvoiceModal from 'components/modals/invoice'
import { ModalStages } from 'components/modals/modal'

const MultiplyLightning: NextPage = () => {
  const { newContract } = useContext(ContractsContext)

  const [data, setData] = useState('')
  const [invoice, setInvoice] = useState('')
  const [result, setResult] = useState('')
  const [stage, setStage] = useState(ModalStages.NeedsInvoice)
  const [useWebln, setUseWebln] = useState(false)

  const handleInvoice = async () => {}
  const resetDeposit = () => {}

  if (!EnabledTasks[Tasks.Multiply]) return <NotAllowed />
  if (!newContract) return <SomeError>Contract not found</SomeError>

  return (
    <>
      <EnablersLightning
        contract={newContract}
        handleAlby={handleInvoice}
        handleInvoice={handleInvoice}
        task={Tasks.Multiply}
      />
      <InvoiceDepositModal
        contract={newContract}
        data={data}
        invoice={invoice}
        result={result}
        reset={resetDeposit}
        retry={() => {}}
        stage={stage}
        task={Tasks.Multiply}
        useWebln={useWebln}
      />
      <InvoiceModal contract={newContract} handler={handleInvoice} />
    </>
  )
}

export default MultiplyLightning
