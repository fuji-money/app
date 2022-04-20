import { useState } from 'react'
import { Offer } from 'lib/types'
import OffersFilter from './filter'
import OffersHeader from './header'
import OffersList from './list'

const filterOffers = (offers: Offer[] | undefined) => (filter: string) => {
  if (!offers) return []
  if (!filter) return offers
  const regexp = new RegExp(filter, 'gi')
  return offers.filter(
    ({ synthetic, collateral, id }) =>
      collateral.name.match(regexp) ||
      collateral.ticker.match(regexp) ||
      collateral.ratio?.toString().match(regexp) ||
      synthetic.name.match(regexp) ||
      synthetic.ticker.match(regexp) ||
      id.match(regexp),
  )
}

interface OffersProps {
  offers: Offer[]
  ticker: any
}

const Offers = ({ offers, ticker }: OffersProps) => {
  const [filter, setFilter] = useState(ticker)

  const filteredOffers = filterOffers(offers)(filter)

  return (
    <section>
      <OffersHeader />
      <OffersFilter filter={filter} setFilter={setFilter} />
      {offers && <OffersList offers={filteredOffers} />}
    </section>
  )
}

export default Offers
