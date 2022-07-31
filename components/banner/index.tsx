import { NetworkContext } from 'components/providers/network'
import { useContext } from 'react'

export default function Banner() {
  const { network } = useContext(NetworkContext)

  const text =
    network === 'testnet'
      ? 'This is a Testnet environment. The assets have no value'
      : '⚠️ Fuji App is only available on the Liquid Testnet. Change network in your wallet'

  const bgColor = network === 'testnet' ? 'info' : 'danger'

  return (
    <>
      <p className={bgColor}>{text}</p>
      <style jsx>{`
        p {
          font-weight: 700;
          padding: 1em;
          margin-bottom: 1em;
          text-align: center;
        }
        p.info {
          background-color: #6b1d9c;
          color: white;
        }
        p.danger {
          background-color: #dc3768;
          color: white;
        }
      `}</style>
    </>
  )
}
