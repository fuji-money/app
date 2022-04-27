import { useEffect } from 'react'

// update range bar colors
const updateColors = (multiple: number, max: number) => {
  if (typeof window !== 'undefined') {
    // don't run server side
    const target = document.getElementById('range')
    if (!target) return false
    target.style.backgroundSize = (multiple / max) * 100 + '% 100%'
  }
}

interface RangeProps {
  multiple: number
  setMultiple: any
}

const Range = ({ multiple, setMultiple }: RangeProps) => {
  const max = 400

  useEffect(() => {
    updateColors(multiple, max)
  }, [multiple])

  return (
    <>
      <div className="is-flex is-justify-content-space-between">
        <div>
          <p className="is-size-7">Liquidation price</p>
          <p className="is-size-5 is-gradient">$ 234,890.00</p>
        </div>
        <div className="has-text-right">
          <p className="is-size-7">Collateral ratio</p>
          <p className="is-size-5">200.00%</p>
        </div>
      </div>
      <input
        id="range"
        min="0"
        max={max}
        type="range"
        value={multiple}
        onChange={(e) => setMultiple(parseInt(e.target.value))}
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
