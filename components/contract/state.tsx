import { prettyPriceLevel } from 'lib/pretty'
import { Contract } from 'lib/types'

interface PrettyStateProps {
  contract: Contract
}

const PrettyState = ({ contract }: PrettyStateProps) => {
  const priceLevel = prettyPriceLevel(contract.priceLevel)
  return (
    <div className="state-container is-flex">
      <p className={`state ${contract.state}`}>
        <span>&bull;</span>
        <span>{contract.state}</span>
      </p>
      <p className="tooltip">{priceLevel}</p>
      <style jsx>{`
        .tooltip {
          background: linear-gradient(
            139.8deg,
            #63159b 15.77%,
            #f49da4 175.57%
          );
          border-radius: 4px;
          color: white;
          font-size: 0.6rem;
          font-weight: 700;
          line-height: 0.5rem;
          margin: auto 4px;
          padding: 4px;
          visibility: hidden;
        }
        .state-container:hover .tooltip {
          visibility: visible;
        }
        .state {
          border-radius: 16px;
          display: flex;
          font-weight: 700;
          line-height: 0.5rem;
          padding: 4px;
          margin: auto 0;
          width: 5rem;
        }
        .state span {
          display: block;
          margin: auto;
        }
        .state span:nth-child(1) {
          /* bullet */
          font-size: 2rem;
        }
        .state span:nth-child(2) {
          /* string */
          flex-grow: 8;
          font-size: 0.6rem;
          padding-bottom: 0px;
          text-align: center;
          text-transform: uppercase;
        }
        .state.safe {
          background-color: #e4fcff;
          color: #64bec9;
        }
        .state.unsafe {
          background-color: #ffecdb;
          color: #ffba78;
        }
        .state.critical {
          background-color: #ffdedf;
          color: #ff4e53;
        }
        .state.closed,
        .state.liquidated,
        .state.unknown {
          background-color: #eee;
          color: #000;
        }
        .state.redeemed {
          background-color: #e4fcff;
          color: #64bec9;
        }
      `}</style>
    </div>
  )
}

export default PrettyState
