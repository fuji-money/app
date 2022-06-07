import { prettyNumber, prettyPercentage } from 'lib/pretty'
import Image from 'next/image'
import { Stock } from 'lib/types'

interface StockRowProps {
  stock: Stock
}

const StockRow = ({ stock }: StockRowProps) => {
  const { asset, delta } = stock
  const deltaClass = delta < 0 ? 'delta red' : 'delta green'
  return (
    <div className="pr-4 has-text-centered">
      <Image alt="asset logo" height={90} src={asset.icon} width={60} />
      <p className={deltaClass}>{prettyPercentage(delta)}</p>
    </div>
  )
}

export default StockRow
