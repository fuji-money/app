import { Asset } from 'lib/types'

const ProgressBar = ({ asset }: { asset: Asset }) => {
  if (!asset.mint) return <></>
  const { actual, max } = asset.mint
  const percentFilledBarWidth = (actual * 100) / max
  const percentEmptyBarWidth = 100 - percentFilledBarWidth
  const [yellow, purple] = ['#ffede3', '#6b1d9c']
  return (
    <div className="progress-container is-flex">
      <div className="filled">
        <span>{actual || ''}</span>
      </div>
      <div className="empty">
        <span>{max - actual || ''}</span>
      </div>
      <style jsx>{`
        div {
          height: 1.5rem;
        }
        div.filled {
          background-color: ${purple};
          border-top-left-radius: 2px;
          border-bottom-left-radius: 2px;
          width: ${percentFilledBarWidth}%;
        }
        div.empty {
          background-color: ${yellow};
          border-radius: 2px;
          text-align: right;
          width: ${percentEmptyBarWidth}%;
        }
        span {
          color: #b4a0ab;
          display: none;
          font-size: 0.75rem;
          padding: 0 4px;
          position: relative;
        }
        .progress-container:hover span {
          display: inline;
        }
      `}</style>
    </div>
  )
}

export default ProgressBar
