import Image from 'next/image'
import Link from 'next/link'

const MultiplyOffer = () => {
  return (
    <div>
      <div className="is-box has-pink-border mx-auto mt-6">
        <div className="icon-container is-justify-content-center level">
          <Image
            src="/images/assets/btc.svg"
            alt="Bitcoin logo"
            height={60}
            width={60}
          />
          &nbsp;
          <Image
            src="/images/icons/arrow.svg"
            alt="Arrow right"
            height={30}
            width={30}
          />
          <Image
            src="/images/assets/lbtc.svg"
            alt="Liquid Bitcoin logo"
            height={60}
            width={60}
          />
        </div>
        <h2 className="has-text-centered">BTC-LONG</h2>
        <p className="has-text-centered is-size-7 mt-4 mb-5 px-4">
          Only the collateral will be locked on the Liquid Network, redeemable
          anytime. The FUJI USD amount is converted into BTC automatically.
        </p>
        <div className="is-flex is-justify-content-space-between">
          <div>
            <p className="is-secondary-purple has-text-weight-bold is-size-7">
              Max Multiple
            </p>
            <h3 className="is-purple">4.33x</h3>
          </div>
          <div>
            <p className="is-secondary-purple has-text-weight-bold is-size-7 has-text-right">
              Redeem & Swap fee
            </p>
            <h3 className="is-purple has-text-right">1.5%</h3>
          </div>
        </div>
        <p className="has-text-centered mt-2">
          <Link href={`/multiply/btc-long`}>
            <button disabled className="button is-primary ml-3">Coming soon</button>
          </Link>
        </p>
      </div>
      <style jsx>{`
        .is-box {
          max-width: 400px;
        }
        .icon-container {
          margin-bottom: -10px;
          position: relative;
          top: -42px;
        }
        .button {
          min-width: 100%;
        }
      `}</style>
    </div>
  )
}

export default MultiplyOffer
