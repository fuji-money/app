import { ContractState } from 'lib/types'

interface PrettyStateProps {
  state: ContractState
}

const PrettyState = ({ state }: PrettyStateProps) => {
  return (
    <p className={`state ${state}`}>
      <span>&bull;</span>
      <span>{state}</span>
      <style jsx>{`
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
    </p>
  )
}

export default PrettyState
