import { Contract, Offer, Oracle } from 'lib/types'
import BorrowForm from './form'
import Balance from 'components/balance'
import { useState } from 'react'
import BorrowInfo from './info'
import BorrowButton from './button'
import Title from 'components/deposit/title'
import Notifications from 'components/notifications'
import { getContractPriceLevel } from 'lib/contracts'
import { minBorrowRatio } from 'lib/constants'
import BorrowDeposit from './deposit'

interface BorrowProps {
  offer: Offer
  oracles: Oracle[]
}

const Borrow = ({ offer, oracles }: BorrowProps) => {
  const [deposit, setDeposit] = useState(false)
  const [channel, setChannel] = useState('')
  const [ratio, setRatio] = useState(offer.collateral.ratio || 0)
  const minRatio = offer.collateral.ratio || minBorrowRatio
  const priceLevel = getContractPriceLevel(offer.collateral, minRatio)
  const [contract, setContract] = useState<Contract>({ ...offer, priceLevel })

  const topup = 0

  // in the case user clicks back while on channel selection
  // or in provider selection, brings him back to borrow form
  const onBack = () => {
    window.removeEventListener('popstate', onBack)
    setDeposit(false)
  }
  // only add event listener when deposit is defined,
  // to prevent polution of event listeners
  if (deposit) window.addEventListener('popstate', onBack)

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
                  minRatio={minRatio}
                  oracles={oracles}
                  ratio={ratio}
                  setContract={setContract}
                  setRatio={setRatio}
                />
                <BorrowInfo contract={contract} />
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
              <BorrowDeposit
                contract={contract}
                channel={channel}
                setChannel={setChannel}
                setDeposit={setDeposit}
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
