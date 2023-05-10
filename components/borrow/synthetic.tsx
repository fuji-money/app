import Image from 'next/image'
import { Asset } from 'lib/types'
import { fromSatoshis } from 'lib/utils'

interface SyntheticProps {
  asset: Asset
  setSyntheticQuantity: (e: React.ChangeEvent<HTMLInputElement>) => void
}

const Synthetic = ({ asset, setSyntheticQuantity }: SyntheticProps) => {
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
            onChange={setSyntheticQuantity}
            placeholder="0.00"
            type="number"
            value={fromSatoshis(asset.quantity, asset.precision) || ''}
            autoFocus
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

export default Synthetic
