import { prettyNumber } from 'lib/pretty'
import { Asset } from 'lib/types'

const LeftToMint = ({ asset }: { asset: Asset }) => {
  const amount = (asset.mint?.max ?? 0) - (asset.mint?.actual ?? 0)
  return (
    <>
      <p className="has-text-weight-bold is-size-8">Left to mint</p>
      <p className="is-size-7 is-gradient">{prettyNumber(amount, 0, 3)}</p>
      <style jsx>{`
        div p {
          color: #88389d;
          font-size: 0.75rem;
        }
      `}</style>
    </>
  )
}

export default LeftToMint
