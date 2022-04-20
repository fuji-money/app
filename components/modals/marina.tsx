import { Contract, Ticker } from 'lib/types'
import Summary from 'components/contract/summary'
import Spinner from 'components/pay/spinner'
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
  topup: number | undefined
  setResult: any
}

const MarinaModal = ({ contract, topup, setResult }: MarinaModalProps) => {
  const { ticker } = contract.collateral
  return (
    <Modal id="marina-modal">
      {contract && (
        <>
          <Spinner />
          <h3>Waiting for confirmation...</h3>
          <Intro ticker={ticker} topup={topup} />
          <Summary contract={contract} />
          <p className="confirm" onClick={() => setResult('success')}>
            Confirm this transaction in your Marina wallet
          </p>
        </>
      )}
    </Modal>
  )
}

export default MarinaModal
