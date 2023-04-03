import { ActivityType } from 'lib/types'
import Image from 'next/image'

interface ActivitiesHeaderProps {
  setActivityType: (arg0: ActivityType) => void
}

const ActivitiesHeader = ({ setActivityType }: ActivitiesHeaderProps) => {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setActivityType(e.target.value as ActivityType)
  }
  return (
    <div className="header level mb-4">
      <div className="level-left">
        <div className="level-item">
          <h2>Activity</h2>
        </div>
      </div>
      <div className="level-right">
        <div className="level-item">
          <p className="has-text-weight-bold">
            <span className="mr-4">
              <Image
                src="/images/icons/filter.svg"
                alt="filter icon"
                height={14}
                width={14}
              />
            </span>
            <span>Filter by:</span>
          </p>
          <div className="select is-rounded is-primary is-small ml-4">
            <select onChange={handleChange}>
              <option value={ActivityType.Creation}>
                {ActivityType.Creation}
              </option>
              <option value={ActivityType.Redeemed}>
                {ActivityType.Redeemed}
              </option>
              <option value={ActivityType.Topup}>{ActivityType.Topup}</option>
              <option value={ActivityType.Liquidated}>
                {ActivityType.Liquidated}
              </option>
            </select>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ActivitiesHeader
