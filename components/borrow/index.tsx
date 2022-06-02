import { Contract, Offer, Oracle } from 'lib/types'
import Form from './form'
import Balance from 'components/balance'
import { useState } from 'react'
import Info from './info'
import BorrowButton from './button'
import Deposit from 'components/deposit'
import Title from 'components/deposit/title'
import Notifications from 'components/notifications'

interface BorrowProps {
  offer: Offer
  oracles: Oracle[]
}

const Borrow = ({ offer, oracles }: BorrowProps) => {
  const [deposit, setDeposit] = useState(false)
  const [network, setNetwork] = useState('')
  const [ratio, setRatio] = useState(offer.collateral.ratio || 0)
  const [contract, setContract] = useState<Contract>(offer)
  const minRatio = offer.collateral.ratio || 150

  const topup = 0

  return (
    <section>
      <Title name="Borrow" network={network} deposit={deposit} />
      <div className="row">
        <div className="columns">
          <div className="column is-8">
            {!deposit && (
              <>
                <Form
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
