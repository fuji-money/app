import { prettyNumber } from 'lib/pretty'
import { Asset, TradeTypes } from 'lib/types'
import Image from 'next/image'
import ReviewOrderButton from './button'

interface ExchangeTradeProps {
  setTrade: any
  synthetic: Asset
  trade: TradeTypes
}

const ExchangeTrade = ({ setTrade, synthetic, trade }: ExchangeTradeProps) => {
  const { name, ticker, icon, value } = synthetic

  const toggleTrade = () =>
    setTrade(trade === TradeTypes.Buy ? TradeTypes.Sell : TradeTypes.Buy)

  return (
    <div className="is-box has-pink-border mb-6">
      <div className="level">
        <div className="level-left is-block">
          <h2>
            {trade} {name}
          </h2>
          <p className="is-size-7 is-grey">
            1 {ticker} | {prettyNumber(value)} USD
          </p>
        </div>
        <div className="level-right">
          <Image
            alt="asset logo"
            height={60}
            src={icon}
            width={40}
            onClick={() => setTrade(TradeTypes.None)}
          />
        </div>
      </div>
      <p className="has-text-weight-bold mb-2">fBMN</p>
      <div className="has-pink-border p-2 mb-4">
        <p className="is-purple is-size-7 has-text-weight-bold">
          Amount to {trade}
        </p>
        <input className="input" min="0" placeholder="0.00" type="number" />
      </div>
      <p className="has-text-right">
        <Image
          alt="switch icon"
          height={20}
          src="/images/icons/switch.svg"
          width={20}
          onClick={toggleTrade}
        />
      </p>
      <p className="has-text-weight-bold mb-2">fUSD</p>
      <div className="has-pink-border p-2 mb-5">
        <p className="is-purple is-size-7 has-text-weight-bold">
          Amount to {trade}
        </p>
        <input className="input" min="0" placeholder="0.00" type="number" />
      </div>
      <ReviewOrderButton />
      <style jsx>{`
        input {
          border: 0;
          -webkit-box-shadow: none;
          box-shadow: none;
          width: 100%;
        }
        input:focus {
          border-color: inherit;
          -webkit-box-shadow: none;
          box-shadow: none;
        }
      `}</style>
    </div>
  )
}

export default ExchangeTrade
