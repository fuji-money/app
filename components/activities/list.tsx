import { useContext, useEffect, useState } from 'react'
import { getActivities } from 'lib/marina'
import { Activity, ActivityType } from 'lib/types'
import EmptyState from 'components/layout/empty'
import SomeError from 'components/layout/error'
import Loading from 'components/layout/loading'
import { WalletContext } from 'components/providers'
import ActivityRow from './row'

interface ActivitiesListProps {
  activityType: ActivityType
}

const ActivitiesList = ({ activityType }: ActivitiesListProps) => {
  const [activities, setActivities] = useState<Activity[]>()
  const [isLoading, setLoading] = useState(false)

  const { wallet } = useContext(WalletContext)

  useEffect(() => {
    setLoading(true)
    getActivities().then((data) => {
      setActivities(data)
      setLoading(false)
    })
  }, [wallet])

  if (!wallet) return <EmptyState>🔌 Connect your wallet to view your activities</EmptyState>
  if (isLoading) return <Loading />
  if (!activities) return <SomeError>Error getting activities</SomeError>

  const filteredActivities = activities.filter((a) => a.type === activityType)

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
