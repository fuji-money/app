import MultiplyButton from './button'
import { useContext, useEffect, useState } from 'react'
import Range from './range'
import Snippet from './snippet'
import Image from 'next/image'
import { fromSatoshis, openModal, toSatoshis } from 'lib/utils'
import MultiplyModals from 'components/modals/multiply'
import Collateral from './collateral'
import { Asset, Contract, Offer } from 'lib/types'
import Spinner from 'components/spinner'
import SomeError from 'components/layout/error'
import Oracles from 'components/oracles'
import { minMultiplyRatio } from 'lib/constants'
import { ModalIds } from 'components/modals/modal'
import { TICKERS } from 'lib/assets'
import { ContractsContext } from 'components/providers/contracts'
import { ConfigContext } from 'components/providers/config'
import { getContractExpirationDate } from 'lib/contracts'
import Notifications from 'components/notifications'

interface MultiplyFormProps {
  offer: Offer
}

const MultiplyForm = ({ offer }: MultiplyFormProps) => {
  const { config } = useContext(ConfigContext)
  const { loading } = useContext(ContractsContext)
  const { assets, oracles } = config

  const minRatio = offer.synthetic.minCollateralRatio || minMultiplyRatio
  const maxRatio = minRatio + 200

  const [contract, setContract] = useState<Contract>(offer)
  const [lbtc, setLbtc] = useState<Asset>()
  const [quantitySats, setQuantitySats] = useState(0)
  const [ratio, setRatio] = useState(200)

  const [values, setValues] = useState({
    exposure: 0,
    fujiDebt: 0,
    multiple: 0,
  })

  useEffect(() => {
    setLbtc(assets.find((asset) => asset.ticker === TICKERS.lbtc))
  }, [assets])

  useEffect(() => {
    if (lbtc) {
      const quantity = fromSatoshis(quantitySats, lbtc.precision)
      const quocient = (1 / ratio) * 100
      const fujiDebt = quantity * lbtc.value * quocient
      const exposure = fujiDebt / lbtc.value + quantity
      const multiple = quantity ? exposure / quantity : 0
      const liqp = (lbtc.value * minRatio) / ratio
      contract.priceLevel = liqp
      contract.expirationDate = getContractExpirationDate()
      contract.collateral.quantity = quantitySats
      contract.synthetic.quantity = toSatoshis(
        fujiDebt,
        contract.synthetic.precision,
      )
      setContract(contract)
      setValues({
        exposure,
        fujiDebt,
        multiple,
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lbtc, quantitySats, ratio])

  if (loading) return <Spinner />
  if (!lbtc) return <SomeError>Error getting L-BTC asset</SomeError>
  if (!oracles) return <SomeError>Error getting oracles</SomeError>

  return (
    <div className="columns">
      <div className="column is-4">
        <div className="is-box has-pink-border">
          <div className="is-flex is-justify-content-space-between">
            <p className="is-size-7 has-text-weight-bold">Liquidation price</p>
            <p>
              <a onClick={() => openModal(ModalIds.LiquidationPrice)}>
                <Image
                  src="/images/icons/help.svg"
                  alt="help icon"
                  height={20}
                  width={20}
                />
              </a>
            </p>
          </div>
          <p className="is-size-5 is-gradient has-text-weight-bold">US$ 0.00</p>
          <p>
            <span className="is-after">
              $ {contract.priceLevel?.toLocaleString()} after
            </span>
          </p>
        </div>
        <div className="is-box has-pink-border">
          <div className="is-flex is-justify-content-space-between">
            <p className="is-size-7 has-text-weight-bold">Current price</p>
            <p>
              <a onClick={() => openModal(ModalIds.CurrentPrice)}>
                <Image
                  src="/images/icons/help.svg"
                  alt="help icon"
                  height={20}
                  width={20}
                />
              </a>
            </p>
          </div>
          <p className="is-size-5 is-gradient has-text-weight-bold">
            US$ {lbtc.value.toLocaleString()}
          </p>
        </div>
        <div className="row">
          <div className="columns">
            <div className="column is-6">
              <Snippet
                title="FUJI Debt"
                value="0.000 FUSD"
                after={`${values.fujiDebt.toLocaleString()} after`}
              />
            </div>
            <div className="column is-6">
              <Snippet
                title="Total L-BTC exposure"
                value="0.000 L-BTC"
                after={`${values.exposure.toLocaleString()} after`}
              />
            </div>
          </div>
          <div className="columns">
            <div className="column is-6">
              <Snippet
                title="FUJI debt multiplier"
                value="0.00x"
                after={`${values.multiple.toLocaleString()}x after`}
              />
            </div>
          </div>
        </div>
      </div>
      <div className="column is-1"></div>
      <div className="column is-7">
        <div className="is-box has-pink-border">
          <p className="has-text-weight-bold">Configure your vault</p>
          <p className="is-size-7 mt-5">
            In vivamus mi pretium pharetra cursus lacus, elit. Adipiscing eget
            vel ut non duis vitae. Augue mi, bibendum ac imperdiet ipsum sed
            ornare. Facilisis id sem quam elementum euismod ante ut.
          </p>
          <p className="has-text-weight-bold mt-6 mb-4">Deposit your L-BTC</p>
          <Collateral asset={lbtc} setQuantity={setQuantitySats} />
          <p className="has-text-weight-bold mt-6 mb-4">Adjust your multiply</p>
          <Range
            liquidationPrice={contract.priceLevel ?? 0}
            minRatio={minRatio}
            maxRatio={maxRatio}
            ratio={ratio}
            setRatio={setRatio}
          />
          <p className="has-text-weight-bold mt-5 mb-4">
            Choose oracle providers
          </p>
          <Oracles contract={contract} setContract={setContract} />
        </div>
        <Notifications contract={contract} ratio={ratio} minRatio={minRatio} />
        <p className="has-text-centered mt-6 mb-4">
          <MultiplyButton
            contract={contract}
            minRatio={minRatio}
            ratio={ratio}
          />
        </p>
      </div>
      <MultiplyModals />
    </div>
  )
}

export default MultiplyForm
