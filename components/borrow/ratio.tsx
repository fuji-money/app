import { useEffect } from 'react'
import { prettyRatio } from 'lib/pretty'
import { Asset } from 'lib/types'
import { getRatioState } from 'lib/utils'

// update range bar colors
const updateColors = (ratio: number) => {
  if (typeof window !== 'undefined') {
    // don't run server side
    const target = document.getElementById('range')
    if (!target) return false
    const width = target.offsetWidth
    target.style.backgroundSize = (ratio * 100) / width + '% 100%'
  }
}

// put range labels on correct coordinates
const updateLabels = (min: number, safe: number) => {
  if (typeof window !== 'undefined') {
    // don't run server side
    const _min = document.getElementById('min')
    const _safe = document.getElementById('safe')
    if (!_min || !_safe) return
    let left = min - 25 // 25 = 50/2 with 50 = safe delta
    _min.style.left = `${left}px`
    if (safe >= min + 40) {
      _safe.style.left = `${left}px`
    } else {
      _safe.style.visibility = 'hidden'
    }
  }
}

interface RatioProps {
  collateral: Asset
  ratio?: number
  setContractRatio: any
}

const Ratio = ({ collateral, ratio = 150, setContractRatio }: RatioProps) => {
  const min = collateral.ratio || 0
  const safe = min + 50
  const state = getRatioState(ratio, min)
  const setRatio = (e: any) => setContractRatio(e.target.value)

  useEffect(() => {
    updateLabels(min, safe)
    updateColors(ratio)
  }, [min, safe, ratio])

  return (
    <>
      <p className="range-legend">
        <span onClick={() => setContractRatio(min)} id="min">
          min: {prettyRatio(min)}%
        </span>
        <span onClick={() => setContractRatio(safe)} id="safe">
          safe: {prettyRatio(safe)}%
        </span>
      </p>
      <div className="level">
        <div className="level-left">
          <div className="level-item">
            <input
              id="range"
              min="0"
              max="400"
              type="range"
              className={state}
              value={ratio}
              onChange={setRatio}
            />
          </div>
        </div>
        <div className="level-right">
          <div className="level-item">
            <div className="level has-pink-border has-pink-background has-text-right pr-5">
              <input
                className="input has-pink-background has-text-right has-suffix"
                placeholder="{ratio}%"
                type="number"
                value={ratio}
                onChange={setRatio}
              />
              <span>%</span>
            </div>
          </div>
        </div>
      </div>
      <style jsx>{`
        p.range-legend span {
          display: inline-block;
          font-size: 0.6rem;
          position: relative;
          text-align: center;
          width: 50px;
        }
        input[type='number'] {
          border: 0;
          max-width: 100px;
        }
        input:focus {
          border-color: inherit;
          -webkit-box-shadow: none;
          box-shadow: none;
        }
        input.has-suffix {
          margin-right: 0;
          padding-right: 0;
        }
        input[type='range'] {
          -webkit-appearance: none;
          margin-right: 15px;
          width: 400px;
          height: 7px;
          background: #ffddbb;
          border-radius: 5px;
          background-image: linear-gradient(#6b1d9c, #6b1d9c);
          background-size: 50% 100%;
          background-repeat: no-repeat;
        }
        input[type='range']::-webkit-slider-thumb {
          -webkit-appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #aaa;
          cursor: ew-resize;
          box-shadow: 0 0 2px 0 #555;
          transition: background 0.3s ease-in-out;
        }
        input[type='range']::-webkit-slider-runnable-track {
          -webkit-appearance: none;
          box-shadow: none;
          border: none;
          background: transparent;
        }
        input[type='range'].safe {
          background-image: linear-gradient(#6b1d9c, #6b1d9c);
        }
        input[type='range'].unsafe {
          background-image: linear-gradient(#ff712c, #ff712c);
        }
        input[type='range'].critical,
        input[type='range'].liquidated {
          background-image: linear-gradient(#e30f00, #e30f00);
        }
      `}</style>
    </>
  )
}

export default Ratio
