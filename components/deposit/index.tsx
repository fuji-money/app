import { useState } from 'react'
import { Contract } from 'lib/types'
import Network from './network'
import Qrcode from './qrcode'
import Result from './result'
import Marina from './marina'

interface DepositProps {
  contract: Contract
  network: string
  setNetwork: any
  topup: number
}

const Deposit = ({ contract, network, setNetwork, topup }: DepositProps) => {
  const ticker = contract.collateral.ticker
  const [result, setResult] = useState('')
  const qrcode = !result && network === 'lightning'
  const marina = !result && network === 'liquid'
  return (
    <div className="is-box py-6 px-6">
      {!network && <Network ticker={ticker} setNetwork={setNetwork} />}
      {qrcode && (
        <Qrcode contract={contract} setResult={setResult} topup={topup} />
      )}
      {marina && (
        <Marina contract={contract} setResult={setResult} topup={topup} />
      )}
      {result && <Result contract={contract} result={result} />}
    </div>
  )
}

export default Deposit
