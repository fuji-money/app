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
import { fromSatoshis, toSatoshis } from 'lib/utils'
import MultiplyInfo from './info'
import { AssetPair, TDEXMarket, isTDEXMarket } from 'lib/tdex/types'
import {
  fetchMarketsFromProvider,
  getBestMarket,
  getMarketPrice,
} from 'lib/tdex/market'
import { getProvidersFromRegistry } from 'lib/tdex/registry'
import { WalletContext } from 'components/providers/wallet'

interface MultiplyProps {
  offer: Offer
}

const Multiply = ({ offer }: MultiplyProps) => {
  const { network } = useContext(WalletContext)
  const { config } = useContext(ConfigContext)
  const { loading } = useContext(ContractsContext)
  const { oracles } = config

  const [contract, setContract] = useState<Contract>(offer)
  const [values, setValues] = useState({ exposure: 0, multiple: 0 })
  const [ratio, setRatio] = useState(200)

  const minRatio = offer.synthetic.minCollateralRatio || minMultiplyRatio

  const assetPair: AssetPair = {
    from: offer.synthetic,
    dest: offer.collateral,
  }

  const [markets, setMarkets] = useState<TDEXMarket[]>([])

  // fetch and set markets (needs to fetch providers)
  useEffect(() => {
    const asyncFetchAndSetMarkets = async () => {
      try {
        const markets: TDEXMarket[] = []
        for (const provider of await getProvidersFromRegistry(network)) {
          for (let market of await fetchMarketsFromProvider(provider)) {
            markets.push({
              ...market,
              price: await getMarketPrice(market),
            })
          }
        }
        setMarkets(markets.filter(isTDEXMarket))
        console.log('getBestMarket', getBestMarket(markets, assetPair))
      } catch (err) {
        console.error(err)
      }
    }
    asyncFetchAndSetMarkets()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [network])

  // update multiply values (exposure and multiply)
  useEffect(() => {
    let exposure = 0
    let multiple = 0
    const { collateral, synthetic } = contract
    if (collateral.value) {
      const quantity = fromSatoshis(collateral.quantity, collateral.precision)
      const fujiDebt = fromSatoshis(synthetic.quantity, synthetic.precision)
      exposure = fujiDebt / collateral.value + quantity
      multiple = quantity ? exposure / quantity : 0
    }
    setValues({
      exposure: toSatoshis(exposure, collateral.precision),
      multiple,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contract.collateral.quantity, ratio])

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
            <MultiplyInfo contract={contract} values={values} />
            <Notifications
              contract={contract}
              minRatio={minRatio}
              ratio={ratio}
            />
            <MultiplyButton
              contract={contract}
              minRatio={minRatio}
              ratio={ratio}
            />
          </div>
        </div>
      </div>
    </section>
  )
}

export default Multiply
