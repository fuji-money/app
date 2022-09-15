import { Contract } from 'lib/types'
import Summary from 'components/contract/summary'
import Image from 'next/image'

interface MarinaProps {
  contract: Contract
  handler: () => void
}

const Marina = ({ contract, handler }: MarinaProps) => {
  return (
    <div className="columns">
      <div className="column is-6">
        <button className="button is-primary" onClick={handler}>
          <Image
            src="/images/marina.svg"
            alt="marina logo"
            width={20}
            height={20}
          />
          <span className="ml-2">Deposit with Marina</span>
        </button>
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

export default Marina
