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
import { maxMultiplyRatio, minMultiplyRatio } from 'lib/constants'
import { ModalIds } from 'components/modals/modal'
import { TICKERS } from 'lib/assets'
import { ContractsContext } from 'components/providers/contracts'
import { ConfigContext } from 'components/providers/config'
import { getContractPriceLevel } from 'lib/contracts'

interface MultiplyFormProps {
  offer: Offer
}

const MultiplyForm = ({ offer }: MultiplyFormProps) => {
  const { config } = useContext(ConfigContext)
  const { loading } = useContext(ContractsContext)

  const [contract, setContract] = useState<Contract>(offer)
  const [lbtc, setLbtc] = useState<Asset>()
  const [exposure, setExposure] = useState(0)
  const [fujiDebt, setFujiDebt] = useState(0)
  const [liquidationPrice, setLiquidationPrice] = useState(0)
  const [multiplier, setMultiplier] = useState(0)
  const [quantity, setQuantity] = useState(0)
  const [ratio, setRatio] = useState(maxMultiplyRatio)

  const { assets, oracles } = config

  useEffect(() => {
    setLbtc(assets.find((asset) => asset.ticker === TICKERS.lbtc))
  }, [assets])

  useEffect(() => {
    if (lbtc) {
      const { collateral, synthetic } = contract
      const qtty = fromSatoshis(quantity, lbtc.precision)
      const quoc = (1 / ratio) * 100
      const debt = qtty * lbtc.value * quoc
      const expo = debt / lbtc.value + qtty
      const mult = qtty ? expo / quantity : 0
      const liqp = (lbtc.value * minMultiplyRatio) / ratio
      collateral.quantity = quantity
      synthetic.quantity = toSatoshis(debt, synthetic.precision)
      setFujiDebt(debt)
      setMultiplier(mult)
      setExposure(expo)
      setLiquidationPrice(liqp)
      setContract(contract)
      console.log('minMultiplyRatio', minMultiplyRatio)
      console.log('lbtc.value', lbtc.value)
      console.log('asset', collateral)
      console.log('liqp', liqp)
      console.log(
        'getContractPriceLevel',
        getContractPriceLevel(collateral, ratio),
      )
    }
  }, [contract, lbtc, quantity, ratio, setContract])

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
              $ {liquidationPrice.toLocaleString()} after
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
                after={`${fujiDebt.toLocaleString()} after`}
              />
            </div>
            <div className="column is-6">
              <Snippet
                title="Total L-BTC exposure"
                value="0.000 L-BTC"
                after={`${exposure.toLocaleString()} after`}
              />
            </div>
          </div>
          <div className="columns">
            <div className="column is-6">
              <Snippet
                title="FUJI debt multiplier"
                value="0.00x"
                after={`${multiplier.toLocaleString()}x after`}
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
          <Collateral asset={lbtc} setQuantity={setQuantity} />
          <p className="has-text-weight-bold mt-6 mb-4">Adjust your multiply</p>
          <Range
            liquidationPrice={liquidationPrice}
            minRatio={minMultiplyRatio}
            maxRatio={maxMultiplyRatio}
            ratio={ratio}
            setRatio={setRatio}
          />
          <p className="has-text-weight-bold mt-5 mb-4">
            Choose oracle providers
          </p>
          <Oracles contract={contract} setContract={setContract} />
          <p className="has-text-centered mt-6 mb-4">
            <MultiplyButton contract={contract} />
          </p>
        </div>
      </div>
      <MultiplyModals />
    </div>
  )
}

export default MultiplyForm
