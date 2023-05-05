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
        <span>{actual}</span>
      </div>
      <div className="empty">
        <span>{max - actual}</span>
      </div>
      <style jsx>{`
        div.filled {
          background-color: ${purple};
          height: 1rem;
          padding-left: 4px;
          width: ${percentFilledBarWidth}%;
        }
        div.filled span {
          color: ${yellow};
        }
        div.empty {
          background-color: ${yellow};
          height: 1rem;
          padding-right: 4px;
          text-align: right;
          width: ${percentEmptyBarWidth}%;
        }
        div.empty span {
          color: ${purple};
        }
        span {
          display: none;
          font-size: 0.6rem;
          position: relative;
          top: -5px;
        }
        .progress-container:hover span {
          display: inline;
        }
      `}</style>
    </div>
  )
}

export default ProgressBar
