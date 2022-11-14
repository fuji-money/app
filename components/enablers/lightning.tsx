import { Contract } from 'lib/types'
import Summary from 'components/contract/summary'
import Title from 'components/title'
import Balance from 'components/balance'
import { operationFromTask } from 'lib/utils'
import { EnablerButton } from './button'
import { useContext } from 'react'
import { WalletContext } from 'components/providers/wallet'

interface EnablersLightningProps {
  contract: Contract
  handleInvoice: () => void
  task: string
}

const EnablersLightning = ({
  contract,
  handleInvoice,
  task,
}: EnablersLightningProps) => {
  const { weblnProvider } = useContext(WalletContext)
  return (
    <section>
      <Title title={`Select method to ${operationFromTask(task)}`} />
      <div className="row">
        <div className="columns">
          <div className="column is-8">
            <div className="is-box has-pink-border has-text-centered p-6">
              <div className="columns">
                <div className="column is-6">
                  <EnablerButton
                    name="Lightning Invoice"
                    icon="/images/networks/lightning.svg"
                    handler={handleInvoice}
                  />
                  <EnablerButton
                    name="Strike"
                    icon="/images/companies/strike.svg"
                  />
                  <EnablerButton
                    name="Bitfinex Pay"
                    icon="/images/companies/bitfinex.svg"
                  />
                  <EnablerButton
                    name="Alby"
                    icon="/images/companies/alby.png"
                    handler={weblnProvider ? handleInvoice : undefined}
                  />
                </div>
                <div className="column is-6">
                  <Summary contract={contract} />
                </div>
              </div>
            </div>
          </div>
          <div className="column is-4">
            <Balance />
          </div>
        </div>
      </div>
    </section>
  )
}

export default EnablersLightning
