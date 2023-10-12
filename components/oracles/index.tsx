import { ConfigContext } from 'components/providers/config'
import { Contract, Oracle } from 'lib/types'
import { useContext } from 'react'

interface OraclesProps {
  contract: Contract
  setContract: (arg0: Contract) => void
}

export default function Oracles({ contract, setContract }: OraclesProps) {
  const { config } = useContext(ConfigContext)

  const { oracles } = config

  const hasOracle = (id = '') => contract.oracles.includes(id)

  const handleClick = ({ pubkey }: Oracle) => {
    if (!pubkey) return
    const newOracles = hasOracle(pubkey)
      ? contract.oracles.filter((opk) => opk != pubkey)
      : [...contract.oracles, pubkey]
    setContract({ ...contract, oracles: newOracles })
  }

  return (
    <div>
      {oracles.map((oracle, index) => (
        <p
          key={index}
          className={hasOracle(oracle.pubkey) ? 'selected' : ''}
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
