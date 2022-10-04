import { Contract } from 'lib/types'
import Image from 'next/image'
import Summary from 'components/contract/summary'
import Title from 'components/title'
import Balance from 'components/balance'
import { operationFromTask } from 'lib/utils'

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
  return (
    <section>
      <Title title={`Select method to ${operationFromTask(task)}`} />
      <div className="row">
        <div className="columns">
          <div className="column is-8">
            <div className="is-box has-pink-border has-text-centered p-6">
              <div className="columns">
                <div className="column is-6">
                  <p>
                    <button
                      className="button is-primary"
                      onClick={handleInvoice}
                    >
                      <Image
                        src="/images/networks/lightning.svg"
                        alt="lightning logo"
                        width={20}
                        height={20}
                      />
                      <span className="ml-2">Lightning Invoice</span>
                    </button>
                  </p>
                  <p>
                    <button className="button is-primary mt-4" disabled>
                      <Image
                        src="/images/companies/strike.svg"
                        alt="strike logo"
                        width={20}
                        height={20}
                      />
                      <span className="ml-2">Strike</span>
                    </button>
                  </p>
                  <p>
                    <button className="button is-primary mt-4" disabled>
                      <Image
                        src="/images/companies/bitfinex.svg"
                        alt="bitfinex logo"
                        width={20}
                        height={20}
                      />
                      <span className="ml-2">Bitfinex Pay</span>
                    </button>
                  </p>
                  <style jsx>{`
                    .button {
                      justify-content: flex-start;
                      width: 90%;
                    }
                  `}</style>
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
