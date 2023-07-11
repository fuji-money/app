import { Contract, Offer } from 'lib/types'
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
import { minBorrowRatio, safeBorrowMargin } from 'lib/constants'
import { ContractsContext } from 'components/providers/contracts'
import { WalletContext } from 'components/providers/wallet'

interface BorrowProps {
  offer: Offer
}

const Borrow = ({ offer }: BorrowProps) => {
  const { network, wallet, wallets } = useContext(WalletContext)
  const { newContract } = useContext(ContractsContext)

  const { collateral, oracles, synthetic } = offer

  const startingRatio = (synthetic.minCollateralRatio ?? 0) + safeBorrowMargin
  const [ratio, setRatio] = useState(startingRatio)

  const minRatio = synthetic.minCollateralRatio || minBorrowRatio
  const priceLevel = getContractPriceLevel(offer, startingRatio)

  if (!wallet) throw new Error('Wallet not found')

  const [contract, setContract] = useState<Contract>({
    collateral,
    expirationDate: getContractExpirationDate(),
    network,
    oracles,
    synthetic,
    priceLevel,
    xPubKey: wallet.getMainAccountXPubKey()
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
            <BorrowForm
              contract={contract}
              minRatio={minRatio}
              ratio={ratio}
              setContract={setContract}
              setRatio={setRatio}
            />
          </div>
          <div className="column is-4">
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
          </div>
        </div>
      </div>
    </section>
  )
}

export default Borrow
