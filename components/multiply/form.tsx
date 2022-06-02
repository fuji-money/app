import MultiplyButton from './button'
import { Dispatch, SetStateAction, useEffect, useState } from 'react'
import Range from './range'
import Snippet from './snippet'
import Image from 'next/image'
import { openModal } from 'lib/utils'
import MultiplyModals from 'components/modals/multiply'
import Collateral from './collateral'
import { fetchAsset } from 'lib/api'
import { Asset, Contract } from 'lib/types'
import Spinner from 'components/spinner'
import SomeError from 'components/layout/error'

interface MultiplyFormProps {
  contract: Contract
  setContract: Dispatch<SetStateAction<Contract>>
  setDeposit: Dispatch<SetStateAction<boolean>>
}

const MultiplyForm = ({
  contract,
  setContract,
  setDeposit,
}: MultiplyFormProps) => {
  const minRatio = 130 // TODO move to constants?
  const maxRatio = 330 // TODO move to constants?

  const [lbtc, setLbtc] = useState<Asset>()
  const [exposure, setExposure] = useState(0)
  const [fujiDebt, setFujiDebt] = useState(0)
  const [isLoading, setLoading] = useState(false)
  const [liquidationPrice, setLiquidationPrice] = useState(0)
  const [multiplier, setMultiplier] = useState(0)
  const [quantity, setQuantity] = useState(0)
  const [ratio, setRatio] = useState(maxRatio)

  useEffect(() => {
    setLoading(true)
    fetchAsset('LBTC').then((data) => {
      setLbtc(data)
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    if (lbtc) {
      const quoc = (1 / ratio) * 100
      const debt = (quantity * lbtc.value * quoc) / (1 - quoc)
      const expo = debt / lbtc.value + quantity
      const mult = quantity ? expo / quantity : 0
      const liqp = (lbtc.value / ratio) * minRatio
      setFujiDebt(debt)
      setMultiplier(mult)
      setExposure(expo)
      setLiquidationPrice(liqp)
      setContract((c) => {
        const collateral = { ...c.collateral, quantity }
        const synthetic = { ...c.synthetic, quantity: debt }
        return { ...c, collateral, synthetic }
      })
    }
  }, [lbtc, quantity, ratio, setContract])

  if (isLoading) return <Spinner />
  if (!lbtc) return <SomeError>Error getting LBTC asset</SomeError>

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
                <span className="is-after">
                  $ {liquidationPrice.toLocaleString()} after
                </span>
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
                    value="0.000 LBTC"
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
              <Collateral asset={lbtc} setQuantity={setQuantity} />
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

export default MultiplyForm
