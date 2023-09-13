/* eslint-disable react/display-name */
import Modal, { ModalIds, ModalStages } from './modal'
import { sleep } from 'lib/utils'
import QRCode from 'components/qrcode'
import { useContext, useState } from 'react'
import Result from 'components/result'
import Spinner from 'components/spinner'
import { Contract } from 'lib/types'
import Summary from 'components/contract/summary'
import Image from 'next/image'
import { WeblnContext } from 'components/providers/webln'

interface PayWithLightningModalProps {
  contract: Contract
  data: string
  invoice: string
  result: string
  reset: () => void
  retry: () => void
  stage: ModalStages
  task: string
  useWebln: boolean
}

const PayWithLightningModal = ({
  contract,
  data,
  invoice,
  result,
  reset,
  retry,
  stage,
  task,
  useWebln,
}: PayWithLightningModalProps) => {
  const { weblnCanEnable, weblnProvider } = useContext(WeblnContext)
  const [buttonText, setButtonText] = useState('Copy')

  const payWithWebln = async () => {
    if (weblnProvider) {
      try {
        if (!weblnProvider.enabled && weblnCanEnable)
          await weblnProvider.enable()
        await weblnProvider.sendPayment(invoice)
      } catch (ignore) {}
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(invoice).then(
      () => {
        setButtonText('Copied')
        sleep(5000).then(() => setButtonText('Copy'))
      },
      (err) => console.error('Could not copy text: ', err),
    )
  }

  const MainMessage = ({ text }: { text: string }) => (
    <h3 className="mt-4">{text}</h3>
  )

  const SecondaryMessage = ({ text }: { text: string }) => (
    <p className="confirm">{text}</p>
  )

  const ContractSummary = () => (
    <div className="mx-auto">
      <Summary contract={contract} />
    </div>
  )

  let ModalContent = () => <></>

  switch (stage) {
    case ModalStages.NeedsAddress:
      ModalContent = () => (
        <>
          <Spinner />
          <MainMessage text="Making swap" />
          <p>Requesting submarine swap:</p>
          <ContractSummary />
          <SecondaryMessage text="Waiting for address from submarine swap" />
        </>
      )
      break
    case ModalStages.NeedsConfirmation:
      ModalContent = () => (
        <>
          <Spinner />
          <MainMessage text="Approve transaction" />
          <p>Confirm contract:</p>
          <ContractSummary />
          <SecondaryMessage text="Accept and unlock this transaction in your Marina wallet" />
        </>
      )
      break
    case ModalStages.NeedsFinishing:
      ModalContent = () => (
        <>
          <Spinner />
          <MainMessage text="Finishing" />
          <p>Creating contract:</p>
          <ContractSummary />
          <SecondaryMessage text="Broadcasting transaction" />
        </>
      )
      break
    case ModalStages.NeedsFujiApproval:
      ModalContent = () => (
        <>
          <Spinner />
          <MainMessage text="Preparing transaction" />
          <p>Preparing contract:</p>
          <ContractSummary />
          <SecondaryMessage text="Waiting for Fuji approval" />
        </>
      )
      break
    case ModalStages.NeedsInvoice:
      ModalContent = () => (
        <>
          <Spinner />
          <MainMessage text="Making reverse swap" />
          <p>Deposit to contract:</p>
          <ContractSummary />
          <SecondaryMessage text="Waiting for invoice" />
        </>
      )
      break
    case ModalStages.NeedsPayment:
      ModalContent = useWebln
        ? () => (
            <>
              <Spinner />
              <MainMessage text="Deposit with Alby" />
              <p className="has-text-centered mt-4">
                <button onClick={payWithWebln} className="button is-primary">
                  Pay invoice
                </button>
              </p>
              <SecondaryMessage text="Waiting for payment" />
            </>
          )
        : () => (
            <>
              <Spinner />
              <MainMessage text="Deposit by scanning this QR" />
              <QRCode text={invoice} />
              <SecondaryMessage text="Waiting for payment" />
              <p className="has-text-centered mt-4">
                <button onClick={handleCopy} className="button">
                  {buttonText}
                </button>
              </p>
            </>
          )
      break
    case ModalStages.NeedsTDEXSwap:
      ModalContent = () => (
        <>
          <Spinner />
          <MainMessage text="TDEX swap" />
          <p>Creating swap:</p>
          <ContractSummary />
          <SecondaryMessage text="Waiting for TDEX swap to complete" />
        </>
      )
      break
    case ModalStages.PaymentReceived:
      ModalContent = () => (
        <>
          <p>
            <Image
              src={`/images/status/success.svg`}
              alt="status icon"
              height={100}
              width={100}
            />
          </p>
          <MainMessage text="Payment received" />
        </>
      )
      break
    case ModalStages.ShowResult:
      ModalContent = () => (
        <Result
          contract={contract}
          data={data}
          result={result}
          retry={retry}
          task={task}
        />
      )
      break
    default:
      break
  }

  return (
    <Modal id={ModalIds.PayWithLightning} reset={reset}>
      <ModalContent />
    </Modal>
  )
}

export default PayWithLightningModal
