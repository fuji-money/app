import MultiplyButton from './button'
import { useEffect, useState } from 'react'
import Range from './range'
import Snippet from './snippet'
import Image from 'next/image'
import { openModal } from 'lib/utils'
import MultiplyModals from 'components/modals/multiply'
import Collateral from './collateral'
import { fetchAsset } from 'lib/api'
import { Asset } from 'lib/types'
import Spinner from 'components/spinner'
import SomeError from 'components/layout/error'

const calcDebt = (price: number, quantity: number, ratio: number) => {
  // s = a1 / (1 - q)
  const q = (1 / ratio) * 100
  const a = quantity * price * q
  return a / (1 - q)
}

const calcExposure = (debt: number, price: number, quantity: number) =>
  debt / price + quantity

const calcLiquidationPrice = (price: number, ratio: number) => 40_000

interface FormProps {
  setDeposit: any
}

const Form = ({ setDeposit }: FormProps) => {
  const [asset, setAsset] = useState<Asset>()
  const [fujiDebt, setFujiDebt] = useState(0)
  const [isLoading, setLoading] = useState(false)
  const [lbtcExposure, setLbtcExposure] = useState(0)
  const [lbtcQuantity, setLbtcQuantity] = useState(0)
  const [liquidationPrice, setLiquidationPrice] = useState(0)
  const [multiplier, setMultiplier] = useState(0)
  const [ratio, setRatio] = useState(200)

  const currentPrice = 42_000 // TODO
  const minRatio = 130 // TODO move to constants?
  const maxRatio = 330 // TODO move to constants?



  useEffect(() => {
    setLoading(true)
    fetchAsset('LBTC').then((data) => {
      setAsset(data)
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    const quoc = (1 / ratio) * 100
    const debt = lbtcQuantity * currentPrice * quoc / (1 - quoc)
    const expo = debt / currentPrice + lbtcQuantity
    const mult = expo / lbtcQuantity
    const liqp = currentPrice / ratio * minRatio
    setFujiDebt(debt)
    setMultiplier(mult)
    setLbtcExposure(expo)
    setLiquidationPrice(liqp)
  }, [lbtcQuantity, ratio])

  if (isLoading) return <Spinner />
  if (!asset) return <SomeError>Error getting offer</SomeError>

  return (
    <section>
      <div className="row">
        <div className="columns">
          <div className="column is-4">
            <div className="is-box">
              <div className="is-flex is-justify-content-space-between">
                <p className="is-size-7 has-text-weight-bold">
                  Liquidation price
                </p>
                <p>
                  <a onClick={() => openModal('liquidation-price-modal')}>
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
                US$ 0.00
              </p>
              <p>
                <span className="is-after">$ {liquidationPrice.toLocaleString()} after</span>
              </p>
            </div>
            <div className="is-box">
              <div className="is-flex is-justify-content-space-between">
                <p className="is-size-7 has-text-weight-bold">Current price</p>
                <p>
                  <a onClick={() => openModal('current-price-modal')}>
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
                US$ {currentPrice.toLocaleString()}
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
                    value="0.000 LBTC"
                    after={`${lbtcExposure.toLocaleString()} after`}
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
            <div className="is-box">
              <p className="has-text-weight-bold">Configure your vault</p>
              <p className="is-size-7 mt-5">
                In vivamus mi pretium pharetra cursus lacus, elit. Adipiscing
                eget vel ut non duis vitae. Augue mi, bibendum ac imperdiet
                ipsum sed ornare. Facilisis id sem quam elementum euismod ante
                ut.
              </p>
              <p className="has-text-weight-bold mt-5 mb-4">
                Deposit your LBTC
              </p>
              <Collateral asset={asset} setLbtcQuantity={setLbtcQuantity} />
              <p className="has-text-weight-bold mt-5 mb-4">
                Adjust your multiply
              </p>
              <Range
                liquidationPrice={liquidationPrice}
                minRatio={minRatio}
                maxRatio={maxRatio}
                ratio={ratio}
                setRatio={setRatio}
              />
              <p className="has-text-centered mt-5 mb-4">
                <MultiplyButton setDeposit={setDeposit} />
              </p>
            </div>
          </div>
        </div>
      </div>
      <MultiplyModals />
    </section>
  )
}

export default Form
