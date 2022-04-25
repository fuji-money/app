import Image from 'next/image'

interface SplashProps {
  click: any
}

const Splash = ({ click }: SplashProps) => {
  return (
    <section>
      <h1>FUJI Multiply</h1>
      <p className="is-size-7 mt-6">
        In vivamus mi pretium pharetra cursus lacus, elit. Adipiscing eget vel
        ut non duis vitae. Augue mi, bibendum ac imperdiet ipsum sed ornare.
        Facilisis id sem quam elementum euismod ante ut. Ac, pharetra elit, sit
        pharetra a. Eu diam nunc nulla risus arcu, integer nulla diam, est. Nisl
        accumsan potenti mattis consectetur pellentesque.
      </p>
      <div>
        <div className="is-box mx-auto mt-6">
          <div className="icon-container is-flex is-justify-content-center">
            <Image
              src="/images/assets/lbtc.svg"
              alt="Liquid Bitcoin logo"
              height={60}
              width={60}
            />
          </div>
          <h2 className="has-text-centered">L-BTC</h2>
          <p className="has-text-centered is-size-7 mt-4 mb-5 px-4">
            Only the collateral will be locked on the Liquid Network, redeemable
            anytime. The borrow amount is converted into BTC automatically.
          </p>
          <div className="is-flex is-justify-content-space-between">
            <div>
              <p className="is-purple is-size-7">Max Multiple</p>
              <h3 className="is-purple">4.33x</h3>
            </div>
            <div>
              <p className="is-purple is-size-7 has-text-right">Variable annual fee</p>
              <h3 className="is-purple has-text-right">4.50%</h3>
            </div>
          </div>
          <p className="has-text-centered mt-2">
            <button onClick={click} className="button is-primary">Multiply</button>
          </p>

        </div>
      </div>
      <style jsx>{`
        .is-box {
          max-width: 400px;
        }
        .icon-container {
          margin-bottom: -10px;
          position: relative;
          top: -45px;
        }
        .button {
          min-width: 100%;
        }
      `}</style>
    </section>
  )
}

export default Splash
