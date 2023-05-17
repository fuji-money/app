import { Contract, Offer, Oracle } from 'lib/types'
import BorrowForm from './form'
import { useContext, useEffect, useState } from 'react'
import BorrowInfo from './info'
import BorrowButton from './button'
import Title from 'components/title'
import Notifications from 'components/notifications'
import {
  getContractPriceLevel,
  getContractRatio,
  getContractExpirationDate,
} from 'lib/contracts'
import { minBorrowRatio } from 'lib/constants'
import { ContractsContext } from 'components/providers/contracts'

interface BorrowProps {
  offer: Offer
}

const Borrow = ({ offer }: BorrowProps) => {
  const { newContract } = useContext(ContractsContext)

  const startingRatio = offer.collateral.minCollateralRatio
    ? offer.collateral.minCollateralRatio + 50
    : 0
  const [ratio, setRatio] = useState(startingRatio)

  const minRatio = offer.collateral.minCollateralRatio || minBorrowRatio
  const priceLevel = getContractPriceLevel(offer.collateral, startingRatio)

  const [contract, setContract] = useState<Contract>({
    ...offer,
    expirationDate: getContractExpirationDate(),
    priceLevel,
  })

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
