import { Contract, Oracle } from 'lib/types'

interface OraclesProps {
  contract: Contract
  oracles: Oracle[]
  setContract: any
}

export default function Oracles({
  contract,
  oracles,
  setContract,
}: OraclesProps) {
  const hasOracle = (id: string) => contract.oracles.includes(id)
  const handleClick = ({ id, disabled }: Oracle) => {
    if (disabled) return
    const newOracles = hasOracle(id)
      ? contract.oracles.filter((o) => o != id)
      : [...contract.oracles, id]
    setContract({ ...contract, oracles: newOracles })
  }
  return (
    <div>
      {oracles.map((oracle, index) => (
        <p
          key={index}
          className={hasOracle(oracle.id) ? 'selected' : ''}
          onClick={() => handleClick(oracle)}
        >
          {oracle.name}
        </p>
      ))}
      <style jsx>{`
        div {
          display: inline-flex;
          flex-wrap: wrap;
        }
        p {
          background-color: #f9d6ff;
          border-radius: 16px;
          color: #80288e;
          cursor: pointer;
          font-weight: 700;
          font-size: 14px;
          letter-spacing: 0.04em;
          line-height: 14px;
          padding: 12px;
          margin: 6px;
          text-align: center;
          text-transform: uppercase;
        }
        p.selected {
          background-color: #80288e;
          color: #f9d6ff;
        }
      `}</style>
    </div>
  )
}
