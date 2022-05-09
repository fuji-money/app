import MultiplyButton from './button'
import { useState } from 'react'
import Range from './range'
import Snippet from './snippet'
import Image from 'next/image'
import { openModal } from 'lib/utils'
import MultiplyModals from 'components/modals/multiply'

interface FormProps {
  setDeposit: any
}

const Form = ({ setDeposit }: FormProps) => {
  const [multiple, setMultiple] = useState(200)

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
                US$ 450.000
              </p>
              <p>
                <span className="is-after">$54.321 after</span>
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
                US$ 450.000
              </p>
            </div>
            <div className="row">
              <div className="columns">
                <div className="column is-6">
                  <Snippet
                    title="FUJI Debt"
                    value="0.000 FUSD"
                    after="8787 after"
                  />
                </div>
                <div className="column is-6">
                  <Snippet
                    title="Total L-BTC exposure"
                    value="0.000 LBTC"
                    after="12,346 after"
                  />
                </div>
              </div>
              <div className="columns">
                <div className="column is-6">
                  <Snippet
                    title="FUJI Debt multiplier"
                    value="0.00x"
                    after="2.33x after"
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
              <div className="has-pink-border info-card px-5 py-4">
                <p className="amount">Amount to deposit</p>
                <p className="quantity">20.00 LBTC</p>
                <p className="value">US$ 8.000.000.246</p>
              </div>
              <p className="has-text-weight-bold mt-5 mb-4">
                Adjust your multiply
              </p>
              <Range multiple={multiple} setMultiple={setMultiple} />
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
