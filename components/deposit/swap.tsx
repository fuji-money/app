import { Contract } from 'lib/types'
import Image from 'next/image'
import Summary from 'components/contract/summary'

interface SwapProps {
  contract: Contract
  handler: () => void
}

const Swap = ({ contract, handler }: SwapProps) => {
  return (
    <div className="columns">
      <div className="column is-6">
        <p>
          <button className="button is-primary" onClick={handler}>
            <Image
              src="/images/networks/lightning.svg"
              alt="lightning logo"
              width={20}
              height={20}
            />
            <span className="ml-2">Pay Lightning Invoice</span>
          </button>
        </p>
        <p>
          <button className="button is-primary mt-4" disabled>
            <Image
              src="/images/companies/strike.svg"
              alt="strike logo"
              width={20}
              height={20}
            />
            <span className="ml-2">Pay with Strike</span>
          </button>
        </p>
        <p>
          <button className="button is-primary mt-4" disabled>
            <Image
              src="/images/companies/bitfinex.svg"
              alt="bitfinex logo"
              width={20}
              height={20}
            />
            <span className="ml-2">Pay with Bitfinex Pay</span>
          </button>
        </p>
        <style jsx>{`
          .button {
            justify-content: flex-start;
            width: 90%;
          }
        `}</style>
      </div>
      <div className="column is-6">
        <Summary contract={contract} />
      </div>
    </div>
  )
}

export default Swap
