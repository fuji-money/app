import { Contract } from 'lib/types'
import { useState } from 'react'
import { getCollateralQuantity, getContractRatio } from 'lib/utils'
import Form from './form'
import Balance from 'components/balance'
import TopupButton from './button'
import Deposit from 'components/deposit'
import Title from 'components/deposit/title'
import Notifications from 'components/notifications'

interface TopupProps {
  contract: Contract
}

const Topup = ({ contract }: TopupProps) => {
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
                <Form contract={contract} ratio={ratio} setRatio={setRatio} />
                <Notifications
                  contract={contract}
                  minRatio={minRatio}
                  ratio={ratio}
                  topup={topup}
                />
                <TopupButton
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
