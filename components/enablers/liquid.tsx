import { Contract } from 'lib/types'
import Summary from 'components/contract/summary'
import Image from 'next/image'
import Balance from 'components/balance'
import Title from 'components/title'
import { operationFromTask } from 'lib/utils'

interface EnablersLiquidProps {
  contract: Contract
  handleMarina: () => void
  task: string
}

const EnablersLiquid = ({
  contract,
  handleMarina,
  task,
}: EnablersLiquidProps) => {
  return (
    <section>
      <Title title={`Select method to ${operationFromTask(task)}`} />
      <div className="row">
        <div className="columns">
          <div className="column is-8">
            <div className="is-box has-pink-border has-text-centered p-6">
              <div className="columns">
                <div className="column is-6">
                  <button className="button is-primary" onClick={handleMarina}>
                    <Image
                      src="/images/marina.svg"
                      alt="marina logo"
                      width={20}
                      height={20}
                    />
                    <span className="ml-2">Marina</span>
                  </button>
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

export default EnablersLiquid
