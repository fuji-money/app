import { WalletContext } from 'components/providers/wallet'
import { feeAmount, minDustLimit } from 'lib/constants'
import { useContext } from 'react'
import Router from 'next/router'

interface TopupButtonProps {
  minRatio: number
  oracles: string[]
  ratio: number
  topup: number
}

const TopupButton = ({ minRatio, oracles, ratio, topup }: TopupButtonProps) => {
  const { connected } = useContext(WalletContext)

  const enabled =
    connected &&
    topup > minDustLimit + feeAmount &&
    ratio > minRatio &&
    oracles.length > 0

  return (
    <div className="has-text-centered">
      <button
        className="button is-primary is-cta"
        disabled={!enabled}
        onClick={() => Router.push(`${Router.router?.asPath}/method`)}
      >
        Proceed to topup
      </button>
    </div>
  )
}

export default TopupButton
