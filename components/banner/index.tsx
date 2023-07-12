import { WalletContext } from 'components/providers/wallet'
import { useContext, useEffect, useState } from 'react'

export default function Banner() {
  const { wallet } = useContext(WalletContext)

  const [network, setNetwork] = useState('liquid')

  useEffect(() => {
    if (wallet) wallet.getNetwork().then((n) => setNetwork(n))
  }, [wallet])

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
