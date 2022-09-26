import { Contract } from 'lib/types'
import { useState } from 'react'
import Balance from 'components/balance'
import Title from 'components/receive/title'
import RedeemReceive from './receive'

interface RedeemProps {
  contract: Contract
}

const Redeem = ({ contract }: RedeemProps) => {
  const [channel, setChannel] = useState('')

  return (
    <section>
      <Title name="Redeem" channel={channel} deposit={true} />
      <div className="row">
        <div className="columns">
          <div className="column is-8">
            <RedeemReceive
              channel={channel}
              contract={contract}
              setChannel={setChannel}
            />
          </div>
          <div className="column is-4">
            <Balance />
          </div>
        </div>
      </div>
    </section>
  )
}

export default Redeem
