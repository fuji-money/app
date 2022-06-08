import { Contract } from 'lib/types'
import { getContractState } from 'lib/utils'
import RedeemButton from 'components/buttons/redeem'
import TopupButton from 'components/buttons/topup'
import PrettyState from 'components/contract/state'
import ExplorerLink from 'components/links/explorer'

interface ContractRowProps {
  contract: Contract
  setRedeem: any
}

const ContractRow = ({ contract, setRedeem }: ContractRowProps) => {
  const { quantity, ticker } = contract.synthetic
  const state = getContractState(contract)
  return (
    <div className="is-box has-pink-border row">
      <div className="columns level">
        <div className="column is-2">
          <p className="has-text-weight-bold">
            {quantity} {ticker}
          </p>
        </div>
        <div className="column is-2">
          <PrettyState state={state} />
        </div>
        <div className="column is-8 has-text-right">
          {contract.txid && <ExplorerLink txid={contract.txid} />}
          <RedeemButton
            contract={contract}
            setRedeem={setRedeem}
            state={state}
          />
          <TopupButton contract={contract} state={state} />
        </div>
      </div>
    </div>
  )
}

export default ContractRow
