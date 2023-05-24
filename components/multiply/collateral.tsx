import Image from 'next/image'
import { Asset } from 'lib/types'
import { toSatoshis } from 'lib/utils'

interface CollateralProps {
  asset: Asset
  setQuantity: (arg0: number) => void
}

const Collateral = ({ asset, setQuantity }: CollateralProps) => {
  const handleChange = (e: any) => {
    setQuantity(toSatoshis(parseFloat(e.target.value), asset.precision))
  }

  return (
    <div className="level has-pink-border has-pink-background">
      <div className="level-left">
        <div className="level-item">
          <p className="ml-3 mt-1">
            <Image
              src={asset.icon}
              alt="synthetic icon"
              height="24"
              width="24"
            />
          </p>
          <p className="ml-3 my-auto">{asset.ticker}</p>
        </div>
      </div>
      <div className="level-right">
        <div className="level-item">
          <input
            className="input has-pink-background has-text-right"
            min="0"
            placeholder="0.00"
            type="number"
            onChange={handleChange}
          />
        </div>
      </div>
      <style jsx>{`
        input {
          border: 0;
          max-width: 100px;
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

export default Collateral
