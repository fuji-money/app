import { prettyExpirationDate, prettyTimeToExpiration } from 'lib/pretty'
import { Contract } from 'lib/types'

const ExpirationDate = ({ contract }: { contract: Contract }) => (
  <>
    <p className="has-text-weight-bold">Expiration Date</p>
    <div className="is-flex is-justify-content-space-between">
      <p>{prettyExpirationDate(contract.expirationDate)}</p>
      <p>{prettyTimeToExpiration(contract.expirationDate)}</p>
    </div>
    <style jsx>{`
      p {
        font-size: 0.6rem;
        font-weight: 700;
      }
      div p {
        font-size: 0.75rem;
      }
      div p:first-child {
        color: #88389d;
      }
    `}</style>
  </>
)

export default ExpirationDate
