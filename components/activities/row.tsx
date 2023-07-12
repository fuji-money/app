import { prettyAgo } from 'lib/pretty'
import { Activity } from 'lib/types'
import Image from 'next/image'
import ExplorerLink from 'components/links/explorer'

interface ActivityRowProps {
  activity: Activity
}

const ActivityRow = ({ activity }: ActivityRowProps) => {
  const { createdAt, contract, message, txid } = activity
  const icon = contract.synthetic.icon || ''
  const [desc, synth] = message.split(' - ')
  return (
    <div className="level">
      <div className="level-left">
        <div className="level-item">
          <Image src={icon} alt="asset logo" height={30} width={30} />
        </div>
        <div className="level-item">
          <p>{desc}</p>
        </div>
        <div className="level-item">
          <p className="is-gradient">{synth}</p>
        </div>
      </div>
      <div className="level-right">
        <div className="level-item">
          <ExplorerLink txid={txid} network={activity.network} />
        </div>
        <div className="level-item">
          <p className="time">{prettyAgo(createdAt)}</p>
        </div>
      </div>
      <style jsx>{`
        img {
          height: 60px;
          padding: 10px;
        }
        p {
          margin: 0;
        }
        p.time {
          color: #6b1d9c;
          font-weight: 700;
          margin: auto 10px;
          text-align: right;
          width: 60px;
        }
        div.level {
          padding: 10px 0;
          margin: 0;
        }
        div.level:not(:last-child) {
          border-bottom: 1px solid #aaa;
        }
      `}</style>
    </div>
  )
}

export default ActivityRow
