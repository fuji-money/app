import { WalletContext } from 'components/providers/wallet'
import { useContext } from 'react'

export default function Banner() {
  const { network } = useContext(WalletContext)

  if (network !== 'testnet') return <></>

  return (
    <>
      <p>This is a Testnet environment. Assets have no value</p>
      <style jsx>{`
        p {
          background-color: #6b1d9c;
          color: white;
          font-weight: 700;
          margin-bottom: 0;
          padding: 1em;
          text-align: center;
        }
      `}</style>
    </>
  )
}
