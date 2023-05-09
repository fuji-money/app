import { prettyNumber } from 'lib/pretty'
import { Asset } from 'lib/types'

const ProgressBar = ({ asset }: { asset: Asset }) => {
  if (!asset.mint) return <></>
  const { actual, max } = asset.mint
  const percentFilledBarWidth = (actual * 100) / max
  const percentEmptyBarWidth = 100 - percentFilledBarWidth
  const [yellow, purple] = ['#ffede3', '#6b1d9c']
  const minted = actual ? prettyNumber(actual, 0, 3) : ''
  const remaining = max - actual ? prettyNumber(max - actual, 0, 3) : ''
  return (
    <div className="progress-container is-flex">
      <div className="filled">
        <span>{minted}</span>
      </div>
      <div className="empty">
        <span>{remaining}</span>
      </div>
      <style jsx>{`
        div {
          height: 2rem;
          border-radius: 2px;
        }
        div.filled {
          background-color: ${purple};
          width: ${percentFilledBarWidth}%;
        }
        div.empty {
          background-color: ${yellow};
          direction: rtl;
          text-align: right;
          width: ${percentEmptyBarWidth}%;
        }
        span {
          color: #b4a0ab;
          display: none;
          font-size: 0.75rem;
          padding: 0 4px;
          position: relative;
          top: 0.25rem;
        }
        .progress-container:hover span {
          display: inline;
        }
      `}</style>
    </div>
  )
}

export default ProgressBar
