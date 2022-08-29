import { useState } from 'react'
import { Contract } from 'lib/types'
import Swap from './swap'
import Result from 'components/result'
import Marina from './marina'
import { ReverseSwap } from 'lib/swaps'
import Channel from './channel'
import SwapModal from 'components/modals/swap'

interface DepositProps {
  contract: Contract
  channel: string
  setChannel: any
  topup: number
}

const Deposit = ({ contract, channel, setChannel, topup }: DepositProps) => {
  const [result, setResult] = useState('')
  const [data, setData] = useState<any>()
  const [swap, setSwap] = useState<ReverseSwap>()
  const lightning = !result && swap
  const liquid = !result && channel === 'liquid'

  return (
    <div className="is-box has-pink-border py-6 px-6">
      {!channel && !result && (
        <Channel
          contract={contract}
          setChannel={setChannel}
          setData={setData}
          setResult={setResult}
          setSwap={setSwap}
        />
      )}
      {lightning && <Swap contract={contract} swap={swap} />}
      {liquid && (
        <Marina
          contract={contract}
          setData={setData}
          setResult={setResult}
          topup={topup}
        />
      )}
      {result && (
        <Result
          data={data}
          result={result}
          setData={setData}
          setResult={setResult}
        />
      )}
      <SwapModal />
    </div>
  )
}

export default Deposit
