import Image from 'next/image'
import { Contract } from 'lib/types'
import {
  DEPOSIT_LIGHTNING_LIMITS,
  swapDepositAmountOutOfBounds,
} from 'lib/swaps'
import { prettyNumber } from 'lib/pretty'
import { WalletContext } from 'components/providers/wallet'
import { useContext } from 'react'
import { getAssetBalance } from 'lib/marina'

interface ChannelButtonProps {
  name: string
  enabled: boolean
  setChannel: (arg0: string) => void
}

const ChannelButton = ({ name, enabled, setChannel }: ChannelButtonProps) => {
  const channelId = name.toLowerCase()
  return (
    <button
      className="button is-primary"
      disabled={!enabled}
      onClick={() => setChannel(channelId)}
    >
      <Image
        src={`/images/networks/${channelId}.svg`}
        alt={`${name} network logo`}
        height={20}
        width={20}
      />
      <span className="ml-2">{name}</span>
      <style jsx>{`
        button {
          margin: auto 1rem;
        }
        img {
          max-height: 1.42rem;
        }
      `}</style>
    </button>
  )
}

interface ChannelProps {
  contract: Contract
  setChannel: (arg0: string) => void
  amount?: number
}

const Channel = ({ contract, setChannel, amount }: ChannelProps) => {
  const { marina } = useContext(WalletContext)
  if (!marina) throw new Error('Missing marina provider')

  const ticker = contract.collateral.ticker
  const quantity = amount || contract.collateral.quantity || 0

  const { maximal, minimal } = DEPOSIT_LIGHTNING_LIMITS

  const outOfBounds = swapDepositAmountOutOfBounds(quantity)
  const lightningButtonEnabled = ticker === 'L-BTC' && !outOfBounds

  return (
    <div className="has-text-centered">
      <h2 className="has-text-weight-bold is-size-4 mb-5">
        Choose how to receive {ticker}
      </h2>
      <div className="content">
        <ChannelButton name="Liquid" enabled={true} setChannel={setChannel} />
        <ChannelButton
          name="Lightning"
          enabled={lightningButtonEnabled}
          setChannel={setChannel}
        />
      </div>
      {outOfBounds && (
        <>
          <p className="warning mx-auto mt-6">
            For lightning swaps, amount must be between{' '}
            {prettyNumber(minimal, 0)} and {prettyNumber(maximal, 0)} satoshis.
          </p>
          <p className="warning mx-auto mt-3">
            Current amount: <strong>{quantity}</strong>
          </p>
        </>
      )}
      <style jsx>{`
        h2 {
          font-size: 1.5rem;
          font-weight: 700;
        }
        p.warning {
          max-width: 350px;
        }
      `}</style>
    </div>
  )
}

export default Channel
