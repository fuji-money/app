import { Contract } from 'lib/types'
import Summary from 'components/contract/summary'
import Balance from 'components/balance'
import Title from 'components/title'
import { operationFromTask } from 'lib/utils'
import { EnablerButton } from './button'
import { Tasks } from 'lib/tasks'

interface EnablersLiquidProps {
  contract: Contract
  handleMarina: () => void
  task: Tasks
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
                  <EnablerButton
                    name="Marina"
                    icon="/images/marina.svg"
                    handler={handleMarina}
                  />
                </div>
                <div className="column is-6">
                  <Summary contract={contract} task={task} />
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
