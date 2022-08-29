import { Contract, Offer, Oracle } from 'lib/types'
import BorrowForm from './form'
import Balance from 'components/balance'
import { useState } from 'react'
import Info from './info'
import BorrowButton from './button'
import Deposit from 'components/deposit'
import Title from 'components/deposit/title'
import Notifications from 'components/notifications'
import { getContractPriceLevel } from 'lib/contracts'

interface BorrowProps {
  offer: Offer
  oracles: Oracle[]
}

const Borrow = ({ offer, oracles }: BorrowProps) => {
  const [deposit, setDeposit] = useState(false)
  const [channel, setChannel] = useState('')
  const [ratio, setRatio] = useState(offer.collateral.ratio || 0)
  const minRatio = offer.collateral.ratio || 150
  const priceLevel = getContractPriceLevel(offer.collateral, minRatio)
  const [contract, setContract] = useState<Contract>({ ...offer, priceLevel })

  const topup = 0

  return (
    <section>
      <Title name="Borrow" channel={channel} deposit={deposit} />
      <div className="row">
        <div className="columns">
          <div className="column is-8">
            {!deposit && (
              <>
                <BorrowForm
                  contract={contract}
                  oracles={oracles}
                  ratio={ratio}
                  setContract={setContract}
                  setRatio={setRatio}
                />
                <Info contract={contract} />
                <Notifications
                  contract={contract}
                  minRatio={minRatio}
                  ratio={ratio}
                  topup={topup}
                />
                <BorrowButton
                  contract={contract}
                  minRatio={minRatio}
                  ratio={ratio}
                  setDeposit={setDeposit}
                />
              </>
            )}
            {deposit && (
              <Deposit
                contract={contract}
                channel={channel}
                setChannel={setChannel}
                topup={topup}
              />
            )}
          </div>
          <div className="column is-4">
            <Balance />
          </div>
        </div>
      </div>
    </section>
  )
}

export default Borrow
