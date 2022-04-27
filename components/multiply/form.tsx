import Snippet from "./snippet"

const Form = () => {
  return (
    <section>
      <div className="row">
        <div className="columns">
          <div className="column is-4">
            <div className="is-box">
              <p className="is-size-7 has-text-weight-bold">Liquidation price</p>
              <p className="is-size-5 is-gradient has-text-weight-bold">US$ 450.000</p>
              <p>
                <span className="is-after">$54.321 after</span>
              </p>
            </div>
            <div className="is-box">
              <p className="is-size-7 has-text-weight-bold">Current price</p>
              <p className="is-size-5 is-gradient has-text-weight-bold">US$ 450.000</p>
              <p>
                <span className="is-size-7 is-grey">$54.321 after</span>
              </p>
            </div>
            <div className="row">
              <div className="columns">
                <div className="column is-6">
                  <Snippet
                    title="FUJI Debt"
                    value="0.000 FUSD"
                    after="8787 after" />
                </div>
                <div className="column is-6">
                  <Snippet
                    title="Total L-BTC exposure"
                    value="0.000 LBTC"
                    after="12,346 after" />
                </div>
              </div>
              <div className="columns">
                <div className="column is-6">
                  <Snippet
                    title="FUJI Debt multiplier"
                    value="0.00x"
                    after="2.33x after" />
                </div>
              </div>
            </div>
          </div>
          <div className="column is-1"></div>
          <div className="column is-7">
            <div className="is-box">
              <p className="has-text-weight-bold">Configure your vault</p>
              <p className="is-size-7 mt-5">
                In vivamus mi pretium pharetra cursus lacus, elit. Adipiscing eget vel
                ut non duis vitae. Augue mi, bibendum ac imperdiet ipsum sed ornare.
                Facilisis id sem quam elementum euismod ante ut.
              </p>
              <p className="has-text-weight-bold mt-5 mb-4">Deposit your LBTC</p>
              <div className="has-pink-border info-card px-5 py-4">
                <p className="amount">Amount to deposit</p>
                <p className="quantity">20.00 LBTC</p>
                <p className="value">US$ 8.000.000.246</p>
              </div>
              <p className="has-text-weight-bold mt-5 mb-4">Adjust your multiply</p>
              <p className="has-text-weight-bold mt-5 mb-4">&nbsp;</p>
              <p className="has-text-centered mt-5 mb-4">
                <button className="button is-primary is-cta">Deposit</button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Form
