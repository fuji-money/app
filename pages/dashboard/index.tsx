import type { NextPage } from 'next'
import Activities from 'components/activities'
import Assets from 'components/assets'
import Contracts from 'components/contracts'

const Dashboard: NextPage = () => {
  return (
    <>
      <Assets />
      <div className="vertical-space"></div>
      <Contracts />
      <div className="vertical-space"></div>
      <Activities />
      <style>{`
        div.vertical-space {
          min-height: 3rem;
        }
      `}</style>
    </>
  )
}

export default Dashboard
