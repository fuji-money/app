import Image from 'next/image'
import { Contract, LightningEnabledTasks } from 'lib/types'
import { swapDepositAmountOutOfBounds } from 'lib/swaps'
import { WalletContext } from 'components/providers/wallet'
import { useContext } from 'react'
import OutOfBounds from 'components/messages/outOfBounds'
import Link from 'next/link'
import { useRouter } from 'next/router'
import Balance from 'components/balance'
import Title from 'components/title'

interface ChannelButtonProps {
  name: string
  enabled?: boolean
}

interface ChannelProps {
  amount?: number
  contract: Contract
  task: string
}

const Channel = ({ amount, contract, task }: ChannelProps) => {
  const { marina } = useContext(WalletContext)
  if (!marina) throw new Error('Missing marina provider')

  const { collateral } = contract
  const ticker = collateral.ticker
  const quantity = amount || collateral.quantity || 0

  const outOfBounds = swapDepositAmountOutOfBounds(quantity)
  console.log('ticker', ticker)
  console.log('outofboubds', outOfBounds)
  console.log('LightningEnabledTasks[task]', LightningEnabledTasks[task])
  console.log('task', task)
  console.log('LightningEnabledTasks', LightningEnabledTasks)
  const lightningEnabled =
    ticker === 'L-BTC' && !outOfBounds && LightningEnabledTasks[task]

  const ChannelButton = ({ name, enabled = true }: ChannelButtonProps) => {
    const channelId = name.toLowerCase()
    const router = useRouter()
    return (
      <Link passHref href={`${router.asPath}/${channelId}`}>
        <button className="button is-primary" disabled={!enabled}>
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
      </Link>
    )
  }

  return (
    <section>
      <Title title="Select channel" />
      <div className="row">
        <div className="columns">
          <div className="column is-8">
            <div className="is-box has-pink-border has-text-centered p-6">
              <h2 className="has-text-weight-bold is-size-4 mb-5">
                Choose how to {task} {ticker}
              </h2>
              <div className="content">
                <ChannelButton name="Liquid" />
                <ChannelButton name="Lightning" enabled={lightningEnabled} />
              </div>
              {outOfBounds && <OutOfBounds amount={quantity} />}
            </div>
          </div>
          <div className="column is-4">
            <Balance />
          </div>
        </div>
      </div>
    </section>
  )
}

export default Channel
