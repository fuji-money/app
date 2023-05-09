import MultiplyButton from './button'
import { useContext, useEffect, useState } from 'react'
import Range from './range'
import Snippet from './snippet'
import Image from 'next/image'
import { openModal } from 'lib/utils'
import MultiplyModals from 'components/modals/multiply'
import Collateral from './collateral'
import { fetchAsset, fetchOracles } from 'lib/api'
import { Asset, Contract, Oracle } from 'lib/types'
import Spinner from 'components/spinner'
import SomeError from 'components/layout/error'
import Oracles from 'components/oracles'
import { maxMultiplyRatio, minMultiplyRatio } from 'lib/constants'
import { ModalIds } from 'components/modals/modal'
import { WalletContext } from 'components/providers/wallet'
import { TICKERS } from 'lib/server'

interface MultiplyFormProps {
  contract: Contract
  setContract: (arg0: Contract) => void
  setDeposit: (arg0: boolean) => void
}

const MultiplyForm = ({
  contract,
  setContract,
  setDeposit,
}: MultiplyFormProps) => {
  const { network } = useContext(WalletContext)
  const [lbtc, setLbtc] = useState<Asset>()
  const [exposure, setExposure] = useState(0)
  const [fujiDebt, setFujiDebt] = useState(0)
  const [isLoading, setLoading] = useState(false)
  const [liquidationPrice, setLiquidationPrice] = useState(0)
  const [multiplier, setMultiplier] = useState(0)
  const [quantity, setQuantity] = useState(0)
  const [oracles, setOracles] = useState<Oracle[]>()
  const [ratio, setRatio] = useState(maxMultiplyRatio)

  useEffect(() => {
    setLoading(true)
    fetchOracles(network).then((data) => {
      setOracles(data)
      fetchAsset(TICKERS.lbtc, network).then((data) => {
        setLbtc(data)
        setLoading(false)
      })
    })
  }, [network])

  useEffect(() => {
    if (lbtc) {
      const quoc = (1 / ratio) * 100
      const debt = (quantity * lbtc.value * quoc) / (1 - quoc)
      const expo = debt / lbtc.value + quantity
      const mult = quantity ? expo / quantity : 0
      const liqp = (lbtc.value / ratio) * minMultiplyRatio
      contract.collateral.quantity = quantity
      contract.synthetic.quantity = debt
      setFujiDebt(debt)
      setMultiplier(mult)
      setExposure(expo)
      setLiquidationPrice(liqp)
      setContract(contract)
    }
  }, [contract, lbtc, quantity, ratio, setContract])

  if (isLoading) return <Spinner />
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
          <Oracles
            contract={contract}
            oracles={oracles}
            setContract={setContract}
          />
          <p className="has-text-centered mt-6 mb-4">
            <MultiplyButton setDeposit={setDeposit} />
          </p>
        </div>
      </div>
      <MultiplyModals />
    </div>
  )
}

export default MultiplyForm
