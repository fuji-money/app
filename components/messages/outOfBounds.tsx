import { prettyNumber } from 'lib/pretty'
import { DEPOSIT_LIGHTNING_LIMITS } from 'lib/swaps'
import { fromSatoshis } from 'lib/utils'

interface QRCodeProps {
  amount: number
}

function OutOfBoundsMessage({ amount }: QRCodeProps) {
  const { maximal, minimal } = DEPOSIT_LIGHTNING_LIMITS

  return (
    <>
      <p className="warning mx-auto mt-6">
        For lightning swaps, amount must be between{' '}
        {prettyNumber(fromSatoshis(minimal), 8)} and{' '}
        {prettyNumber(fromSatoshis(maximal), 8)}
      </p>
      <p className="warning mx-auto mt-3">
        Current amount: <strong>{prettyNumber(fromSatoshis(amount), 8)}</strong>
      </p>
      <style jsx>{`
        p.warning {
          max-width: 350px;
        }
      `}</style>
    </>
  )
}

export default OutOfBoundsMessage
