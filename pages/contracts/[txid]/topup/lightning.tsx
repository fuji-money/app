import type { NextPage } from 'next'
import { useContext, useState } from 'react'
import { ContractsContext } from 'components/providers/contracts'
import EnablersLightning from 'components/enablers/lightning'
import { Tasks } from 'lib/types'
import LightningDepositModal from 'components/modals/lightningDeposit'
import { WalletContext } from 'components/providers/wallet'
import { ModalStages } from 'components/modals/modal'
import SomeError from 'components/layout/error'
import { retry } from 'lib/utils'

const ContractTaskLightning: NextPage = () => {
  const { marina, network } = useContext(WalletContext)
  const { newContract, reloadContracts, resetContracts } =
    useContext(ContractsContext)

  const [data, setData] = useState('')
  const [result, setResult] = useState('')
  const [stage, setStage] = useState(ModalStages.NeedsCoins)

  if (!newContract) return <SomeError>Contract not found</SomeError>

  const quantity = newContract.collateral.quantity
  const payoutAmount = newContract.payoutAmount || 0
  const amount = quantity - payoutAmount

  if (!newContract) throw new Error('Missing contract')

  const handleInvoice = () => {}
  const invoice = ''

  return (
    <>
      <EnablersLightning
        contract={newContract}
        handleInvoice={handleInvoice}
        task={Tasks.Topup}
      />
      <LightningDepositModal
        contract={newContract}
        data={data}
        invoice={invoice}
        result={result}
        retry={retry(setData, setResult, handleInvoice)}
        reset={resetContracts}
        stage={stage}
      />
    </>
  )
}

export default ContractTaskLightning
