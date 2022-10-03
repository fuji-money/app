import { Contract, Offer, Oracle } from 'lib/types'
import BorrowForm from './form'
import Balance from 'components/balance'
import { useState } from 'react'
import BorrowInfo from './info'
import BorrowButton from './button'
import Title from 'components/title'
import Notifications from 'components/notifications'
import { getContractPriceLevel } from 'lib/contracts'
import { minBorrowRatio } from 'lib/constants'

interface BorrowProps {
  offer: Offer
  oracles: Oracle[]
}

const Borrow = ({ offer, oracles }: BorrowProps) => {
  const [ratio, setRatio] = useState(offer.collateral.ratio || 0)

  const minRatio = offer.collateral.ratio || minBorrowRatio
  const priceLevel = getContractPriceLevel(offer.collateral, minRatio)
  const [contract, setContract] = useState<Contract>({ ...offer, priceLevel })

  return (
    <section>
      <Title title="Borrow" />
      <div className="row">
        <div className="columns">
          <div className="column is-8">
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
              />
              <BorrowButton
                contract={contract}
                minRatio={minRatio}
                ratio={ratio}
              />
            </>
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
