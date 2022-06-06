import { Contract, Oracle } from 'lib/types'
import { Dispatch, SetStateAction, useState } from 'react'
import { getCollateralQuantity, getContractRatio } from 'lib/utils'
import TopupForm from './form'
import Balance from 'components/balance'
import TopupButton from './button'
import Deposit from 'components/deposit'
import Title from 'components/deposit/title'
import Notifications from 'components/notifications'

interface TopupProps {
  contract: Contract
  oracles: Oracle[]
  setContract: any
}

const Topup = ({ contract, oracles, setContract }: TopupProps) => {
  const [deposit, setDeposit] = useState(false)
  const [network, setNetwork] = useState('')
  const [ratio, setRatio] = useState(getContractRatio(contract))

  const minRatio = getContractRatio(contract)
  const quantity = getCollateralQuantity(contract, ratio)
  const topup = quantity - (contract.collateral.quantity || 0)

  return (
    <section>
      <Title name="Topup" network={network} deposit={deposit} />
      <div className="row">
        <div className="columns">
          <div className="column is-8">
            {!deposit && (
              <>
                <TopupForm
                  contract={contract}
                  oracles={oracles}
                  ratio={ratio}
                  setRatio={setRatio}
                  setContract={setContract}
                />
                <Notifications
                  contract={contract}
                  minRatio={minRatio}
                  ratio={ratio}
                  topup={topup}
                />
                <TopupButton
                  oracles={contract.oracles}
                  minRatio={minRatio}
                  ratio={ratio}
                  setDeposit={setDeposit}
                  topup={topup}
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

export default Topup
