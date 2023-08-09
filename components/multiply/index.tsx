import { Contract, Offer } from 'lib/types'
import MultiplyForm from './form'
import { useContext, useEffect, useState } from 'react'
import MultiplyButton from './button'
import Title from 'components/title'
import Notifications from 'components/notifications'
import { minMultiplyRatio } from 'lib/constants'
import { ContractsContext } from 'components/providers/contracts'
import SomeError from 'components/layout/error'
import { ConfigContext } from 'components/providers/config'
import Spinner from 'components/spinner'
import MultiplyInfo from './info'
import { AssetPair, TDEXv2Market } from 'lib/tdex/types'
import { findBestMarket } from 'lib/tdex/market'
import { WalletContext } from 'components/providers/wallet'
import { getExposure } from 'lib/tdex/preview'
import { getContractPriceLevel } from 'lib/contracts'
import { extractAxiosError } from 'lib/utils'

interface MultiplyProps {
  offer: Offer
}

const Multiply = ({ offer }: MultiplyProps) => {
  const { network } = useContext(WalletContext)
  const { config } = useContext(ConfigContext)
  const { loading } = useContext(ContractsContext)
  const { oracles } = config

  const initialRatio = 200

  const [contract, setContract] = useState<Contract>({
    ...offer,
    network,
    priceLevel: getContractPriceLevel(offer, initialRatio),
  })
  const [ratio, setRatio] = useState(initialRatio)
  const [tdexError, setTdexError] = useState('')

  const minRatio = offer.synthetic.minCollateralRatio || minMultiplyRatio

  const assetPair: AssetPair = {
    from: offer.synthetic,
    dest: offer.collateral,
  }

  const [market, setMarket] = useState<TDEXv2Market>()

  // fetch and set markets (needs to fetch providers)
  useEffect(() => {
    if (network) {
      findBestMarket(network, assetPair)
        .then((market) => {
          setMarket(market)
          setTdexError('')
        })
        .catch((err) => {
          console.error(err)
          setTdexError(`TDEX error: ${extractAxiosError(err)}`)
        })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [network])

  // update multiply values (exposure and multiply)
  useEffect(() => {
    getExposure(contract, market)
      .then((exposure) => {
        setContract({ ...contract, exposure })
        setTdexError('')
      })
      .catch((err) => {
        console.error(err)
        setTdexError(`TDEX error: ${extractAxiosError(err)}`)
      })

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contract.synthetic.quantity])

  if (loading) return <Spinner />
  if (!oracles) return <SomeError>Error getting oracles</SomeError>

  return (
    <section>
      <Title title="Multiply" />
      <div className="row">
        <div className="columns">
          <div className="column is-8">
            <MultiplyForm
              contract={contract}
              minRatio={minRatio}
              ratio={ratio}
              setContract={setContract}
              setRatio={setRatio}
            />
          </div>
          <div className="column is-4">
            <MultiplyInfo contract={contract} />
            <Notifications
              contract={contract}
              minRatio={minRatio}
              ratio={ratio}
              tdexError={tdexError}
            />
            <MultiplyButton
              contract={contract}
              minRatio={minRatio}
              ratio={ratio}
              tdexError={tdexError}
            />
          </div>
        </div>
      </div>
    </section>
  )
}

export default Multiply
