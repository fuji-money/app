import { Contract, ContractState } from 'lib/types'
import RedeemButton from 'components/buttons/redeem'
import TopupButton from 'components/buttons/topup'
import PrettyState from 'components/contract/state'
import ExplorerLink from 'components/links/explorer'
import { fromSatoshis } from 'lib/utils'

interface ContractRowProps {
  contract: Contract
  setAssetBalance: any
  setRedeem: any
  setStep: any
  setData: any
  setResult: any
}

const ContractRow = ({
  contract,
  setAssetBalance,
  setRedeem,
  setStep,
  setData,
  setResult,
}: ContractRowProps) => {
  const { quantity, ticker } = contract.synthetic
  const state = contract.state || ContractState.Unknown
  return (
    <div className="is-box has-pink-border row">
      <div className="columns level">
        <div className="column is-4 is-flex is-justify-content-space-between">
          <p className="my-auto has-text-weight-bold">
            {fromSatoshis(quantity)} {ticker}
          </p>
          <PrettyState contract={contract} />
        </div>
        <div className="column is-3">
          {contract.txid && <ExplorerLink txid={contract.txid} />}
        </div>
        <div className="column is-5 is-flex is-justify-content-flex-end">
          <RedeemButton
            contract={contract}
            setRedeem={setRedeem}
            setAssetBalance={setAssetBalance}
            setStep={setStep}
            setData={setData}
            setResult={setResult}
          />
          <TopupButton contract={contract} />
        </div>
      </div>
    </div>
  )
}

export default ContractRow
