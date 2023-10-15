import { useEffect } from 'react'
import { prettyPriceLevel, prettyRatio } from 'lib/pretty'
import { Contract } from 'lib/types'
import { getContractPriceLevel, getRatioState } from 'lib/contracts'
import { maxBorrowRatio, minBorrowRatio, safeBorrowMargin } from 'lib/constants'

const thumbWidth = 20

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

const calcLeft = (ratio: number) => {
  if (typeof window !== 'undefined') {
    const container = document.getElementById('range')
    if (container) {
      const startsOn = thumbWidth / 2
      const eachRatio = (container.clientWidth - thumbWidth) / maxBorrowRatio
      const maxLeft = startsOn + maxBorrowRatio * eachRatio
      const left = startsOn + ratio * eachRatio
      if (left > maxLeft) return maxLeft
      return left
    }
  }
  return 0
}

// put range labels on correct coordinates
const updateLabels = (min: number, safe: number) => {
  if (typeof window !== 'undefined') {
    // don't run server side
    const _min = document.getElementById('min')
    const _safe = document.getElementById('safe')
    if (!_min) return
    let left = calcLeft(min) - _min.offsetWidth / 2
    _min.style.left = `${left}px`
    if (!_safe) return
    if (safe) {
      _safe.style.left = `${left}px`
    } else {
      _safe.style.visibility = 'hidden'
    }
  }
}

const updatePriceLevel = (ratio: number) => {
  if (typeof window !== 'undefined') {
    const priceLevel = document.getElementById('price-level')
    const left = calcLeft(ratio)
    if (!priceLevel || !left) return
    priceLevel.style.left = `${left - priceLevel.offsetWidth / 2}px`
  }
}

interface RatioProps {
  contract: Contract
  minRatio?: number
  ratio?: number
  setContractRatio: (ratio: number) => void
}

const Ratio = ({
  contract,
  minRatio,
  ratio = minBorrowRatio,
  setContractRatio,
}: RatioProps) => {
  const min = minRatio || contract.synthetic.minCollateralRatio || 0
  const safe = minRatio ? 0 : min + safeBorrowMargin
  const showSafe = safe > 0
  const state = getRatioState(ratio, min, safe)
  const priceLevel = getContractPriceLevel(contract, ratio)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setContractRatio(Number(e.target.value))

  useEffect(() => {
    updateLabels(min, safe)
  }, [min, safe])

  useEffect(() => {
    updateColors(ratio)
    updatePriceLevel(ratio)
  }, [ratio])

  return (
    <>
      <p>
        <span onClick={() => setContractRatio(min)} id="min">
          min: {prettyRatio(min)}%
        </span>
        {showSafe && (
          <span onClick={() => setContractRatio(safe)} id="safe">
            safe: {prettyRatio(safe)}%
          </span>
        )}
      </p>
      <div className="level mb-0">
        <div className="level-left">
          <div className="level-item">
            <input
              id="range"
              min="0"
              max={maxBorrowRatio.toString()}
              type="range"
              className={state}
              value={ratio}
              onChange={handleChange}
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
                onChange={handleChange}
              />
              <span>%</span>
            </div>
          </div>
        </div>
      </div>
      <p>
        <span id="price-level" className={state}>
          {prettyPriceLevel(priceLevel)}
        </span>
      </p>
      <style jsx>{`
        p span {
          display: inline-block;
          font-size: 0.6rem;
          position: relative;
          text-align: center;
          width: 50px;
        }
        #price-level {
          font-weight: 700;
          width: 100px;
        }
        #price-level.safe {
          color: #6b1d9c;
        }
        #price-level.unsafe {
          color: #ff712c;
        }
        #price-level.critical,
        #price-level.liquidated {
          color: #e30f00;
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
          width: ${thumbWidth}px;
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
