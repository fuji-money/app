import Balance from 'components/balance'
import Deposit from 'components/deposit'
import Title from 'components/deposit/title'
import type { Contract, Offer } from 'lib/types'
import { useState } from 'react'
import MultiplyForm from './form'

interface MultiplyProps {
  offer: Offer
}

const Multiply = ({ offer }: MultiplyProps) => {
  const [deposit, setDeposit] = useState(false)
  const [channel, setChannel] = useState('')
  const [contract, setContract] = useState<Contract>(offer)

  return (
    <section>
      <Title name="Multiply" channel={channel} deposit={deposit} />
      {!deposit && (
        <MultiplyForm
          contract={contract}
          setContract={setContract}
          setDeposit={setDeposit}
        />
      )}
      {deposit && (
        <div className="row">
          <div className="columns">
            <div className="column is-8">
              <Deposit
                contract={contract}
                channel={channel}
                setChannel={setChannel}
                setDeposit={setDeposit}
              />
            </div>
            <div className="column is-4">
              <Balance />
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

export default Multiply
