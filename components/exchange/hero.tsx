import { Asset } from 'lib/types'
import Image from 'next/image'

interface ExchangeHeroProps {
  setTrade: (arg0: string) => void
  synthetic: Asset
}

const ExchangeHero = ({ setTrade, synthetic }: ExchangeHeroProps) => {
  const label = (icon: string, text: string) => (
    <p className="is-after" onClick={() => setTrade(text)}>
      <span className="image-container">
        <Image
          src={`/images/icons/${icon}.svg`}
          alt={`${icon} icon`}
          height={14}
          width={14}
        />
      </span>
      <span className="ml-4">{text}</span>
    </p>
  )

  const { name, ticker, icon } = synthetic
  const state = 'Active' // TODO

  return (
    <div className="is-box has-pink-border mb-6">
      <div className="level">
        <div className="level-left is-block">
          <h2>{name}</h2>
          <p className="is-size-7 is-grey">
            {ticker} | {state}
          </p>
        </div>
        <div className="level-right">
          <Image alt="asset logo" height={60} src={icon} width={40} />
        </div>
      </div>
      <div className="level">
        {label('plus', 'Buy')}
        {label('less', 'Sell')}
        {label('invoice', 'Statement')}
      </div>
    </div>
  )
}

export default ExchangeHero
