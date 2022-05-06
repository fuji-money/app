import Balance from "components/balance"
import Deposit from "components/deposit"
import Title from "components/deposit/title"
import type { Contract, Offer } from "lib/types"
import { useState } from "react"
import Form from "./form"

interface MultiplyProps {
  offer: Offer
}

const Multiply = ({ offer }: MultiplyProps) => {
  const [deposit, setDeposit] = useState(false)
  const [network, setNetwork] = useState('')
  const [contract, setContract] = useState<Contract>(offer)

  const topup = 0

  return (
    <section>
      <Title name="Multiply" network={network} deposit={deposit} />
      {!deposit && <Form setDeposit={setDeposit} />}
      {deposit &&
        <div className="row">
          <div className="columns">
            <div className="column is-8">
              <Deposit
                contract={contract}
                network={network}
                setNetwork={setNetwork}
                topup={topup}
              />
            </div>
            <div className="column is-4">
              <Balance />
            </div>
          </div>
        </div>
      }
    </section>
  )
}

export default Multiply
