import Image from 'next/image'
import { Contract } from 'lib/types'
import { swapDepositAmountOutOfBounds } from 'lib/swaps'
import { WalletContext } from 'components/providers/wallet'
import { useContext } from 'react'
import OutOfBounds from 'components/messages/outOfBounds'
import Link from 'next/link'
import { useRouter } from 'next/router'
import Balance from 'components/balance'
import Title from 'components/title'
import { operationFromTask } from 'lib/utils'
import { LightningEnabledTasks } from 'lib/tasks'

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
  const quantity = amount || collateral.quantity

  const lightningOutOfBounds =
    LightningEnabledTasks[task] && swapDepositAmountOutOfBounds(quantity)
  const lightningButtonEnabled =
    LightningEnabledTasks[task] && ticker === 'L-BTC' && !lightningOutOfBounds

  const ChannelButton = ({ name, enabled = true }: ChannelButtonProps) => {
    const channelId = name.toLowerCase()
    // change .../channel with .../<liquid|lightning>
    const { asPath } = useRouter()
    const path = asPath.split('/')
    path[path.length - 1] = channelId
    return (
      <Link passHref href={`${path.join('/')}`}>
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
                Choose how to {operationFromTask(task)} {ticker}
              </h2>
              <div className="content">
                <ChannelButton name="Liquid" />
                <ChannelButton
                  name="Lightning"
                  enabled={lightningButtonEnabled}
                />
              </div>
              {lightningOutOfBounds && <OutOfBounds amount={quantity} />}
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
