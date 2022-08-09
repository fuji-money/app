import { useContext, useEffect, useState } from 'react'
import { getActivities } from 'lib/activities'
import { Activity, ActivityType } from 'lib/types'
import EmptyState from 'components/layout/empty'
import SomeError from 'components/layout/error'
import { WalletContext } from 'components/providers/wallet'
import ActivityRow from './row'
import Spinner from 'components/spinner'

interface ActivitiesListProps {
  activityType: ActivityType
}

const ActivitiesList = ({ activityType }: ActivitiesListProps) => {
  const [activities, setActivities] = useState<Activity[]>()
  const [isLoading, setLoading] = useState(false)

  const { connected, network } = useContext(WalletContext)

  useEffect(() => {
    ;(async () => {
      setLoading(true)
      setActivities(await getActivities())
      setLoading(false)
    })()
  }, [connected, network])

  if (!connected)
    return (
      <EmptyState>🔌 Connect your wallet to view your activities</EmptyState>
    )
  if (isLoading) return <Spinner />
  if (!activities) return <SomeError>Error getting activities</SomeError>

  const filteredActivities = activities.filter((a) => a.type === activityType)
  if (filteredActivities.length === 0)
    return <EmptyState>No activities yet</EmptyState>

  return (
    <div className="activity-list">
      {filteredActivities &&
        filteredActivities.map((activity: Activity, index: number) => (
          <ActivityRow key={index} activity={activity} />
        ))}
      <style jsx>{`
        .activity-list {
          background-color: #fff;
          margin-top: 20px;
          padding: 20px;
        }
      `}</style>
    </div>
  )
}

export default ActivitiesList
