import type { NextPage } from 'next'
import { useContext, useState } from 'react'
import SomeError from 'components/layout/error'
import { EnabledTasks, Tasks } from 'lib/tasks'
import { ContractsContext } from 'components/providers/contracts'
import NotAllowed from 'components/messages/notAllowed'
import EnablersLiquid from 'components/enablers/liquid'
import MarinaDepositModal from 'components/modals/marinaDeposit'
import { ModalStages } from 'components/modals/modal'

const MultiplyLiquid: NextPage = () => {
  const { newContract } = useContext(ContractsContext)

  const [data, setData] = useState('')
  const [result, setResult] = useState('')
  const [stage, setStage] = useState(ModalStages.NeedsInvoice)

  const handleMarina = () => {}
  const resetDeposit = () => {}

  if (!EnabledTasks[Tasks.Multiply]) return <NotAllowed />
  if (!newContract) return <SomeError>Contract not found</SomeError>

  return (
    <>
      <EnablersLiquid
        contract={newContract}
        handleMarina={handleMarina}
        task={Tasks.Multiply}
      />
      <MarinaDepositModal
        contract={newContract}
        data={data}
        result={result}
        reset={resetDeposit}
        retry={() => {}}
        stage={stage}
        task={Tasks.Multiply}
      />
    </>
  )
}

export default MultiplyLiquid
