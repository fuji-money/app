import { Contract, ContractState } from 'lib/types'
import RedeemButton from 'components/buttons/redeem'
import TopupButton from 'components/buttons/topup'
import PrettyState from 'components/contract/state'
import ExplorerLink from 'components/links/explorer'
import { fromSatoshis } from 'lib/utils'
import LiquidationPrice from 'components/contract/liquidationPrice'
import ExpirationDate from 'components/contract/expirationDate'
import RenewButton from 'components/buttons/renew'
import { contractIsClosed } from 'lib/contracts'

interface ContractRowProps {
  contract: Contract
}

const ContractRow = ({ contract }: ContractRowProps) => {
  const { quantity, ticker, precision } = contract.synthetic
  return (
    <div className="is-box has-pink-border row">
      <div className="columns level">
        <div className="column is-2 is-flex is-justify-content-space-between">
          <p className="my-auto has-text-weight-bold is-size-6">
            {fromSatoshis(quantity, precision)} {ticker}
          </p>
          <PrettyState contract={contract} />
        </div>
        <div className="column is-2">
          <LiquidationPrice contract={contract} />
        </div>
        <div className="column is-2">
          <ExpirationDate contract={contract} />
        </div>
        <div className="column is-2">
          {contract.txid && (
            <ExplorerLink txid={contract.txid} extraClass="is-small" />
          )}
        </div>
        <div className="column is-4 is-flex is-justify-content-flex-end">
          {!contractIsClosed(contract) && (
            <>
              <RedeemButton contract={contract} size="small" />
              {contract.expirationDate && (
                <RenewButton contract={contract} size="small" />
              )}
              <TopupButton contract={contract} size="small" />
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default ContractRow
