import { Contract, Offer } from 'lib/types'
import Form from './form'
import Balance from 'components/balance'
import { useState } from 'react'
import Info from './info'
import BorrowButton from './button'
import Pay from 'components/pay'
import Title from 'components/pay/title'
import Notifications from 'components/notifications'

interface BorrowProps {
  offer: Offer
}

const Borrow = ({ offer }: BorrowProps) => {
  const [pay, setPay] = useState(false)
  const [network, setNetwork] = useState('')
  const [ratio, setRatio] = useState(offer.collateral.ratio || 0)
  const [contract, setContract] = useState<Contract>(offer)
  const minRatio = offer.collateral.ratio || 150

  const topup = 0

  return (
    <section>
      <Title name="Borrow" network={network} pay={pay} />
      <div className="row">
        <div className="columns">
          <div className="column is-8">
            {!pay && (
              <>
                <Form
                  contract={contract}
                  setContract={setContract}
                  ratio={ratio}
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
                  setPay={setPay}
                />
              </>
            )}
            {pay && (
              <Pay
                contract={contract}
                network={network}
                setNetwork={setNetwork}
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
