import { useState } from 'react'
import { ActivityType } from 'lib/types'
import ActivityHeader from './header'
import ActivitiesList from './list'

const Activities = () => {
  const defaultActivityType = ActivityType.Creation
  const [activityType, setActivityType] = useState(defaultActivityType)

  return (
    <section>
      <ActivityHeader setActivityType={setActivityType} />
      <ActivitiesList activityType={activityType} />
    </section>
  )
}

export default Activities
