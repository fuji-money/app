import { Offer } from 'lib/types'
import ExchangeGraphic from './graphic'
import ExchangeHero from './hero'
import ExchangeInfo from './info'

interface ExchangeFormProps {
  offer: Offer
}

const ExchangeForm = ({ offer }: ExchangeFormProps) => {
  const { synthetic } = offer

  return (
    <div className="row">
      <div className="columns">
        <div className="column is-4">
          <ExchangeHero synthetic={synthetic}/>
          <ExchangeInfo />
        </div>
        <div className="column is-1"></div>
        <div className="column is-7">
          <ExchangeGraphic />
        </div>
      </div>
    </div>
  )
}

export default ExchangeForm
