import { prettyExpirationDate, prettyNumber, prettyRatio } from 'lib/pretty'
import { Contract } from 'lib/types'
import { getContractRatio } from 'lib/contracts'
import { fromSatoshis } from 'lib/utils'

interface SummaryProps {
  contract: Contract
}

const Summary = ({ contract }: SummaryProps) => {
  const { collateral, synthetic, priceLevel, expirationDate } = contract
  return (
    <table className="has-text-weight-bold mx-auto">
      <tbody>
        <tr>
          <td>Borrow</td>
          <td>
            {prettyNumber(
              fromSatoshis(synthetic.quantity, synthetic.precision),
            )}
          </td>
          <td>{synthetic.ticker}</td>
        </tr>
        <tr>
          <td>Collateral</td>
          <td>
            {prettyNumber(
              fromSatoshis(collateral.quantity, collateral.precision),
            )}
          </td>
          <td>{collateral.ticker}</td>
        </tr>
        <tr>
          <td>Ratio</td>
          <td>{prettyRatio(getContractRatio(contract))}</td>
          <td>%</td>
        </tr>
        <tr>
          <td>Liquidation price</td>
          <td>{prettyNumber(priceLevel)}</td>
          <td>USD</td>
        </tr>
        <tr>
          <td>Expiration date</td>
          <td>{prettyExpirationDate(expirationDate)}</td>
        </tr>
      </tbody>
      <style jsx>{`
        table,
        tr {
          background-color: white;
          border: 1px solid #f18c95;
          text-align: left;
        }
        td {
          padding: 0.6rem 0.2rem;
        }
        td:first-child {
          padding-left: 1rem;
        }
        td:nth-child(2) {
          text-align: right;
        }
        td:nth-child(2),
        td:nth-child(3) {
          background-image: linear-gradient(90deg, #63159b, #ff80ab);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        td:nth-child(3) {
          padding-right: 1rem;
        }
      `}</style>
    </table>
  )
}

export default Summary
