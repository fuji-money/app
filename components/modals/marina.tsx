import { Contract, Ticker } from 'lib/types'
import Summary from 'components/contract/summary'
import Spinner from 'components/spinner'
import Modal from './modal'
import { prettyNumber } from 'lib/pretty'
import { addContract } from 'lib/contracts'

interface IntroProps {
  ticker: Ticker
  topup: number | undefined
}

const Intro = ({ ticker, topup }: IntroProps) => {
  if (topup)
    return (
      <p>
        Topup contract with{' '}
        <strong>
          +{prettyNumber(topup)} {ticker}:
        </strong>
      </p>
    )
  return <p>Create contract:</p>
}

interface MarinaModalProps {
  contract: Contract
  topup: number | undefined
  setResult: any
}

const MarinaModal = ({ contract, topup, setResult }: MarinaModalProps) => {
  const { ticker } = contract.collateral
  const handleConfirmation = () => {
    addContract(contract)
    setResult('success')
  }
  return (
    <Modal id="marina-modal">
      {contract && (
        <>
          <Spinner />
          <h3 className="mt-4">Waiting for confirmation...</h3>
          <Intro ticker={ticker} topup={topup} />
          <Summary contract={contract} />
          <p className="confirm" onClick={handleConfirmation}>
            Confirm this transaction in your Marina wallet
          </p>
        </>
      )}
    </Modal>
  )
}

export default MarinaModal
