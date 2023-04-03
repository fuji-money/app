import { getContractState } from 'lib/contracts'
import { Contract } from 'lib/types'

interface PrettyStateProps {
  contract: Contract
}

const PrettyState = ({ contract }: PrettyStateProps) => {
  const state = getContractState(contract)
  return (
    <p className={`state ${state}`}>
      &#x25cf;&nbsp;{state}
      <style jsx>{`
        .state {
          border-radius: 16px;
          font-size: 0.5rem;
          font-weight: 700;
          line-height: 0.5rem;
          padding: 5px 4px 4px 4px;
          margin: auto 0;
          text-align: center;
          text-transform: uppercase;
          min-width: 3rem;
          max-width: 5rem;
        }
        .state.safe {
          background-color: #e4fcff;
          color: #64bec9;
        }
        .state.unsafe {
          background-color: #ffecdb;
          color: #f9a14d;
        }
        .state.critical {
          background-color: #ffdedf;
          color: #ff4e53;
        }
        .state.closed,
        .state.liquidated,
        .state.unconfirmed,
        .state.topuped,
        .state.unknown {
          background-color: #eee;
          color: #000;
        }
        .state.redeemed {
          background-color: #e4fcff;
          color: #64bec9;
        }
      `}</style>
    </p>
  )
}

export default PrettyState
