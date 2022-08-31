import { useState } from 'react'
import { Contract } from 'lib/types'
import Swap from './swap'
import Result from 'components/result'
import Marina from './marina'
import { ReverseSwap } from 'lib/swaps'
import Channel from './channel'
import MarinaDepositModal from 'components/modals/marinaDeposit'

interface DepositProps {
  contract: Contract
  channel: string
  setChannel: (arg0: string) => void
  topup: number
}

const Deposit = ({ contract, channel, setChannel, topup }: DepositProps) => {
  const lightning = channel === 'lightning'
  const liquid = channel === 'liquid'

  return (
    <>
      <div className="is-box has-pink-border p-6">
        {!channel && <Channel contract={contract} setChannel={setChannel} />}
        {lightning && <Swap contract={contract} />}
        {liquid && <Marina contract={contract} />}
      </div>
    </>
  )
}

export default Deposit
