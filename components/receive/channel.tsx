import Image from 'next/image'
import { Contract } from 'lib/types'
import { swapDepositAmountOutOfBounds } from 'lib/swaps'
import { WalletContext } from 'components/providers/wallet'
import { useContext } from 'react'
import OutOfBounds from 'components/messages/outOfBounds'

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

  const { collateral } = contract
  const ticker = collateral.ticker
  const quantity = amount || collateral.quantity || 0

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
      {outOfBounds && <OutOfBounds amount={quantity} />}
    </div>
  )
}

export default Channel
