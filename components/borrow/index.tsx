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
import { WalletContext } from 'components/providers/wallet'

interface BorrowProps {
  offer: Offer
}

const Borrow = ({ offer }: BorrowProps) => {
  const { network, xPubKey } = useContext(WalletContext)
  const { newContract } = useContext(ContractsContext)

  const { collateral, oracles, payout, synthetic } = offer

  const startingRatio = collateral.minCollateralRatio
    ? collateral.minCollateralRatio + 50
    : 0
  const [ratio, setRatio] = useState(startingRatio)

  const minRatio = collateral.minCollateralRatio || minBorrowRatio
  const priceLevel = getContractPriceLevel(collateral, startingRatio)

  const [contract, setContract] = useState<Contract>({
    collateral,
    expirationDate: getContractExpirationDate(),
    network,
    oracles,
    payout,
    synthetic,
    priceLevel,
    xPubKey,
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
