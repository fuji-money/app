import { Contract, Ticker } from 'lib/types'
import Summary from 'components/contract/summary'
import Spinner from 'components/spinner'
import Modal from './modal'
import { prettyNumber } from 'lib/pretty'

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
  step: number
  topup: number | undefined
}

const MarinaModal = ({ contract, step, topup }: MarinaModalProps) => {
  const { ticker } = contract.collateral
  const mainMessage = [
    'Preparing transaction...',
    'Waiting for confirmation...',
  ][step]
  const secondaryMessage = [
    'Waiting for Fuji approval',
    'Confirm this transaction in your Marina wallet',
  ][step]
  return (
    <Modal id="marina-modal">
      {contract && (
        <>
          <Spinner />
          <h3 className="mt-4">{mainMessage}</h3>
          <Intro ticker={ticker} topup={topup} />
          <Summary contract={contract} />
          <p className="confirm">{secondaryMessage}</p>
        </>
      )}
    </Modal>
  )
}

export default MarinaModal
