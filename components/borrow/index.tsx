import { Contract, Offer, Oracle } from 'lib/types'
import BorrowForm from './form'
import Balance from 'components/balance'
import { useContext, useEffect, useState } from 'react'
import BorrowInfo from './info'
import BorrowButton from './button'
import Title from 'components/title'
import Notifications from 'components/notifications'
import { getContractPriceLevel, getContractRatio } from 'lib/contracts'
import { minBorrowRatio } from 'lib/constants'
import { ContractsContext } from 'components/providers/contracts'

interface BorrowProps {
  offer: Offer
  oracles: Oracle[]
}

const Borrow = ({ offer, oracles }: BorrowProps) => {
  const { newContract } = useContext(ContractsContext)
  const [ratio, setRatio] = useState(offer.collateral.ratio || 0)

  const minRatio = offer.collateral.ratio || minBorrowRatio
  const priceLevel = getContractPriceLevel(offer.collateral, minRatio)

  const [contract, setContract] = useState<Contract>({ ...offer, priceLevel })

  useEffect(() => {
    if (newContract) {
      setContract(newContract)
      setRatio(getContractRatio(newContract))
    }
  }, [newContract])

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
              <Notifications
                contract={contract}
                minRatio={minRatio}
                ratio={ratio}
              />
            </>
          </div>
          <div className="column is-4">
            <BorrowInfo contract={contract} />
            <BorrowButton
              contract={contract}
              minRatio={minRatio}
              ratio={ratio}
            />
          </div>
        </div>
      </div>
    </section>
  )
}

export default Borrow
