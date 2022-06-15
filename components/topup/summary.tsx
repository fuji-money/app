import { prettyAmount, prettyAsset, prettyRatio } from 'lib/pretty'
import { Contract } from 'lib/types'
import { getContractRatio, getContractState } from 'lib/utils'
import PrettyState from 'components/contract/state'

interface SummaryProps {
  contract: Contract
}

const Summary = ({ contract }: SummaryProps) => {
  const ratio = getContractRatio(contract)
  const state = getContractState(contract)
  return (
    <div className="has-pink-border">
      <div className="row py-4 px-6">
        <div className="columns">
          <div className="column is-4 info-card">
            <p>Synthetic</p>
            <p>{prettyAsset(contract.synthetic)}</p>
            <p>{prettyAmount(contract.synthetic)}</p>
          </div>
          <div className="column is-4 info-card">
            <p>Ratio</p>
            <p>{prettyRatio(ratio)}%</p>
            <PrettyState state={state} />
          </div>
          <div className="column is-4 info-card">
            <p>Collateral</p>
            <p>{prettyAsset(contract.collateral)}</p>
            <p>{prettyAmount(contract.collateral)}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Summary
