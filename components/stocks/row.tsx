import { prettyPercentage } from 'lib/pretty'
import Image from 'next/image'
import { Stock } from 'lib/types'

interface StockRowProps {
  stock: Stock
}

const StockRow = ({ stock }: StockRowProps) => {
  const { asset, delta } = stock
  const deltaClass = delta < 0 ? 'delta red' : 'delta green'
  return (
    <div className="pr-6 has-text-centered">
      <Image alt="asset logo" height={120} src={asset.icon} width={80} />
      <p className={deltaClass}>{prettyPercentage(delta)}</p>
    </div>
  )
}

export default StockRow
