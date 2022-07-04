import Image from 'next/image'
import { Ticker } from 'lib/types'

interface NetworkProps {
  ticker: Ticker
  setNetwork: any
}

const Network = ({ ticker, setNetwork }: NetworkProps) => {
  const disabled = ticker !== 'L-BTC'
  return (
    <div>
      <div className="has-text-centered">
        <h2 className="has-text-weight-bold is-size-4 mb-4">
          Choose how to deposit {ticker}
        </h2>
        <p>
          <button
            className="button is-primary"
            onClick={() => setNetwork('liquid')}
          >
            <Image
              src="/images/networks/liquid.svg"
              alt="liquid network logo"
              height={20}
              width={20}
            />
            Liquid
          </button>
          <button
            className="button is-primary"
            onClick={() => setNetwork('lightning')}
            disabled={disabled}
          >
            <Image
              src="/images/networks/lightning.svg"
              alt="lightning network logo"
              height={20}
              width={20}
            />
            Lightning
          </button>
        </p>
        {disabled && (
          <p className="has-text-weight-bold is-size-7 mt-6">
            {ticker} swaps in Lightning are still in development.
          </p>
        )}
      </div>
      <style jsx>{`
        button {
          margin: auto 1rem;
        }
        h2 {
          font-size: 1.5rem;
          font-weight: 700;
        }
        img {
          margin-right: 1rem;
          max-height: 1.42rem;
        }
      `}</style>
    </div>
  )
}

export default Network
