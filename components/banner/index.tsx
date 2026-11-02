import { ConfigContext } from 'components/providers/config'
import { WalletContext } from 'components/providers/wallet'
import { useContext } from 'react'

export default function Banner() {
  const { network } = useContext(WalletContext)
  const { factoryOffline, loading } = useContext(ConfigContext)

  if (network !== 'testnet' && (loading || !factoryOffline)) return <></>

  return (
    <>
      {network === 'testnet' && (
        <p className="testnet">
          This is a Testnet environment. Assets have no value
        </p>
      )}
      {!loading && factoryOffline && (
        <p className="offline">
          The Fuji contract service is offline. Existing contracts can still be
          redeemed.
        </p>
      )}
      <style jsx>{`
        p {
          color: white;
          font-weight: 700;
          margin-bottom: 0;
          padding: 1em;
          text-align: center;
        }
        .testnet {
          background-color: #6b1d9c;
        }
        .offline {
          background-color: #8a3b12;
        }
      `}</style>
    </>
  )
}
