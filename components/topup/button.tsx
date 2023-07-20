import { feeAmount, minDustLimit } from 'lib/constants'
import Router from 'next/router'

interface TopupButtonProps {
  minRatio: number
  oracles: string[]
  ratio: number
  topup: number
}

const TopupButton = ({ minRatio, oracles, ratio, topup }: TopupButtonProps) => {
  const enabled =
    topup > minDustLimit + feeAmount && ratio > minRatio && oracles.length > 0

  return (
    <div className="has-text-centered">
      <button
        className="button is-primary is-cta"
        disabled={!enabled}
        onClick={() => Router.push(`${Router.router?.asPath}/channel`)}
      >
        Proceed to topup
      </button>
    </div>
  )
}

export default TopupButton
