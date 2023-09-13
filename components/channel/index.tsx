import Image from 'next/image'
import { Asset, Contract } from 'lib/types'
import {
  DEPOSIT_LIGHTNING_LIMITS,
  lightningSwapAmountOutOfBounds,
} from 'lib/swaps'
import { WalletContext } from 'components/providers/wallet'
import { useContext } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import Balance from 'components/balance'
import Title from 'components/title'
import { fromSatoshis, operationFromTask } from 'lib/utils'
import { LightningEnabledTasks, Tasks } from 'lib/tasks'
import { TICKERS } from 'lib/assets'
import { prettyNumber } from 'lib/pretty'

interface OutOfBoundsMessageProps {
  asset: Asset
  recv: number
  send: number
}

const OutOfBoundsMessage = ({ asset, recv, send }: OutOfBoundsMessageProps) => {
  const { maximal, minimal } = DEPOSIT_LIGHTNING_LIMITS

  const minSwap = fromSatoshis(minimal, asset.precision)
  const maxSwap = fromSatoshis(maximal, asset.precision)
  const recvSat = fromSatoshis(recv, asset.precision)
  const sendSat = fromSatoshis(send, asset.precision)

  const invalidRecvAmount =
    recvSat !== 0 && (recvSat < minSwap || recvSat > maxSwap)
  const invalidSendAmount =
    sendSat !== 0 && (sendSat < minSwap || sendSat > maxSwap)

  return (
    <>
      <p className="warning mx-auto mt-6">
        For lightning swaps, amount must be between{' '}
        {prettyNumber(minSwap, asset.precision)} and{' '}
        {prettyNumber(maxSwap, asset.precision)}
      </p>
      {invalidRecvAmount && (
        <p className="warning mx-auto mt-3">
          You are trying to <u>receive</u>:{' '}
          <strong>{prettyNumber(recvSat, asset.precision)}</strong>
        </p>
      )}
      {invalidSendAmount && (
        <p className="warning mx-auto mt-3">
          You are trying to <u>send</u>:{' '}
          <strong>{prettyNumber(sendSat, asset.precision)}</strong>
        </p>
      )}
      <style jsx>{`
        p.warning {
          max-width: 350px;
        }
      `}</style>
    </>
  )
}
interface ChannelButtonProps {
  name: string
  enabled?: boolean
}

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

interface ChannelProps {
  amount?: number
  contract: Contract
  task: string
}

const Channel = ({ amount, contract, task }: ChannelProps) => {
  const { marina } = useContext(WalletContext)
  if (!marina) throw new Error('Missing marina provider')

  const quantity = amount || contract.collateral.quantity

  let send = 0
  let recv = 0

  // find amount(s) we are trying to send and/or receive
  if (task === Tasks.Borrow) send = quantity
  else if (task === Tasks.Redeem) recv = quantity
  else if (task === Tasks.Renew) send = quantity
  else if (task === Tasks.Topup) send = quantity
  else if (task === Tasks.Multiply) {
    if (!contract.exposure) throw new Error('Invalid contract')
    send = quantity
    recv = contract.exposure - quantity
  }

  // check if amount(s) are inside lightning swaps limits
  const sendAmountOutOfBounds = send > 0 && lightningSwapAmountOutOfBounds(send)
  const recvAmountOutOfBounds = recv > 0 && lightningSwapAmountOutOfBounds(recv)
  const someAmountOutOfBounds = sendAmountOutOfBounds || recvAmountOutOfBounds

  const lightningButtonEnabled =
    LightningEnabledTasks[task] &&
    contract.collateral.ticker === TICKERS.lbtc &&
    !someAmountOutOfBounds

  return (
    <section>
      <Title title="Select channel" />
      <div className="row">
        <div className="columns">
          <div className="column is-8">
            <div className="is-box has-pink-border has-text-centered p-6">
              <h2 className="has-text-weight-bold is-size-4 mb-5">
                Choose how to {operationFromTask(task)}{' '}
                {contract.collateral.ticker}
              </h2>
              <div className="content">
                <ChannelButton name="Liquid" />
                <ChannelButton
                  name="Lightning"
                  enabled={lightningButtonEnabled}
                />
              </div>
              {someAmountOutOfBounds && (
                <OutOfBoundsMessage
                  asset={contract.collateral}
                  recv={recv}
                  send={send}
                />
              )}
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
