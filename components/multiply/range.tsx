import { getContractPriceLevel } from 'lib/contracts'
import { Contract } from 'lib/types'
import { ChangeEvent, useEffect, useState } from 'react'

// calculate ratio from range value
const calcRatio = (value: number, min: number, max: number) =>
  max - value * ((max - min) / 100)

// calculate range value from ratio
const calcValue = (ratio: number, min: number, max: number) =>
  ((max - ratio) / (max - min)) * 100

// update range bar colors
const updateColors = (value: number) => {
  if (typeof window === 'undefined') return // don't run server side
  const target = document.getElementById('range')
  if (!target) return // element not found
  target.style.backgroundSize = `${value}% 100%`
}

interface RangeProps {
  contract: Contract
  minRatio: number
  maxRatio: number
  setRatio: (arg0: number) => void
}

const Range = ({ contract, minRatio, maxRatio, setRatio }: RangeProps) => {
  const initialRatio = 200
  const initialRange = calcValue(initialRatio, minRatio, maxRatio)

  const [priceLevel, setPriceLevel] = useState(
    getContractPriceLevel(contract, initialRatio),
  )
  const [rangeValue, setRangeValue] = useState(initialRange)

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newRangeValue = Number(e.target.value)
    const newRatio = calcRatio(newRangeValue, minRatio, maxRatio)
    setRangeValue(newRangeValue)
    setPriceLevel(getContractPriceLevel(contract, newRatio))
  }

  const handleMouseUp = () =>
    setRatio(calcRatio(rangeValue, minRatio, maxRatio))

  useEffect(() => {
    updateColors(rangeValue)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rangeValue])

  useEffect(() => {
    if (contract.priceLevel) setPriceLevel(contract.priceLevel)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contract.priceLevel])

  return (
    <>
      <div className="is-flex is-justify-content-space-between">
        <div>
          <p className="is-size-7">Liquidation price</p>
          <p className="is-size-5 is-gradient">
            $ {priceLevel.toLocaleString()}
          </p>
        </div>
        <div className="has-text-right">
          <p className="is-size-7">Collateral ratio</p>
          <p className="is-size-5">
            {calcRatio(rangeValue, minRatio, maxRatio)}%
          </p>
        </div>
      </div>
      <input
        id="range"
        min="0"
        max="100"
        type="range"
        value={rangeValue}
        onChange={handleChange}
        onMouseUp={handleMouseUp}
      />
      <div className="is-flex is-justify-content-space-between mb-6">
        <p className="is-grey">Decrease risk</p>
        <p className="is-grey">Increase risk</p>
      </div>
      <style jsx>{`
        input[type='range'] {
          -webkit-appearance: none;
          margin-right: 15px;
          min-width: 100%;
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
      `}</style>
    </>
  )
}

export default Range
