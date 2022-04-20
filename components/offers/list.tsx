import { Offer } from 'lib/types'
import OfferRow from './row'

interface OffersListProps {
  offers: Offer[]
}

const OffersTableHeader = () => {
  return (
    <div className="row mt-6 mb-0 pr-4 pl-4">
      <div className="columns">
        <div className="column is-2">
          <h2>Asset</h2>
        </div>
        <div className="column is-2">
          <h2>Collateral asset</h2>
        </div>
        <div className="column is-2">
          <h2>Collateral ratio</h2>
        </div>
        <div className="column is-2">
          <h2>Oracle price</h2>
        </div>
        <div className="column is-4">&nbsp;</div>
      </div>
    </div>
  )
}

const OffersList = ({ offers }: OffersListProps) => {
  return (
    <div className="offers-list">
      <OffersTableHeader />
      {offers &&
        offers.map((offer: Offer, index: number) => (
          <OfferRow key={index} offer={offer} />
        ))}
    </div>
  )
}

export default OffersList
