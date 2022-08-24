import { prettyNumber, prettyRatio } from 'lib/pretty'
import { Contract } from 'lib/types'
import { getContractRatio } from 'lib/contracts'
import { fromSatoshis } from 'lib/utils'

interface SummaryProps {
  contract: Contract
}

const Summary = ({ contract }: SummaryProps) => {
  return (
    <>
      <div className="summary-line has-pink-border">
        <p>Borrow</p>
        <p className="is-gradient">
          {prettyNumber(fromSatoshis(contract.synthetic.quantity))}{' '}
          {contract.synthetic.ticker}
        </p>
      </div>

      <div className="summary-line has-pink-border">
        <p>Collateral</p>
        <p className="is-gradient">
          {prettyNumber(fromSatoshis(contract.collateral.quantity))}{' '}
          {contract.collateral.ticker}
        </p>
      </div>

      <div className="summary-line has-pink-border">
        <p>Ratio</p>
        <p className="is-gradient">
          {prettyRatio(getContractRatio(contract))}%
        </p>
      </div>

      <div className="summary-line has-pink-border">
        <p>Liquidation price</p>
        <p className="is-gradient">
          {prettyNumber(contract.priceLevel)} USD
        </p>
      </div>

      <style jsx>{`
        .summary-line {
          background-color: #fff;
          display: flex;
          font-weight: 700;
          justify-content: space-between;
          padding: 0.7rem 3rem;
          max-width: 400px;
          margin: 2px auto;
        }
        .summary-line p {
          margin: 0;
        }
      `}</style>
    </>
  )
}

export default Summary
