import Image from 'next/image'
import { prettyPriceLevel } from 'lib/pretty'
import { Contract } from 'lib/types'

const LiquidationPrice = ({ contract }: { contract: Contract }) => (
  <div className="is-flex">
    <Image
      alt="price tag icon"
      height={30}
      src={'/images/icons/pricetag.svg'}
      width={30}
    />
    <div className="backgroundPurple">
      <p>Liquidation price</p>
      <p>{prettyPriceLevel(contract.priceLevel)}</p>
    </div>
    <style jsx>{`
      .backgroundPurple {
        background: linear-gradient(139.8deg, #63159b 15.77%, #f49da4 175.57%);
        border-radius: 4px;
        color: white;
        font-size: 0.75rem;
        font-weight: 700;
        margin: auto 4px;
        padding: 4px 20px;
      }
      .backgroundPurple p:first-child {
        font-size: 0.6rem;
      }
    `}</style>
  </div>
)

export default LiquidationPrice
