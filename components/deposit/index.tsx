import { Contract } from 'lib/types'
import Swap from './swap'
import Marina from './marina'
import Channel from './channel'

interface DepositProps {
  contract: Contract
  channel: string
  setChannel: (arg0: string) => void
  setDeposit: (arg0: boolean) => void
  topup: number
}

const Deposit = ({
  contract,
  channel,
  setChannel,
  setDeposit,
  topup,
}: DepositProps) => {
  const lightning = channel === 'lightning'
  const liquid = channel === 'liquid'

  const resetDeposit = () => {
    setChannel('')
    setDeposit(false)
  }

  return (
    <>
      <div className="is-box has-pink-border p-6">
        {!channel && <Channel contract={contract} setChannel={setChannel} />}
        {lightning && <Swap contract={contract} reset={resetDeposit} />}
        {liquid && <Marina contract={contract} reset={resetDeposit} />}
      </div>
    </>
  )
}

export default Deposit
