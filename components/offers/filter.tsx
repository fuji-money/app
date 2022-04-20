import Image from 'next/image'
import { Dispatch, SetStateAction } from 'react'

interface IconProps {
  filter: string
  reset: any
}

const Icon = ({ filter, reset }: IconProps) => {
  if (filter) {
    return (
      <Image
        src="/images/icons/close.svg"
        alt="close icon"
        height="40"
        width="40"
        onClick={reset}
      />
    )
  }
  return (
    <Image
      src="/images/icons/search.svg"
      alt="search icon"
      height="30"
      width="30"
    />
  )
}

interface OffersFilterProps {
  filter: string
  setFilter: Dispatch<SetStateAction<string>>
}

const OffersFilter = ({ filter, setFilter }: OffersFilterProps) => {
  const reset = () => setFilter('')
  const updateFilter = (e: any) => setFilter(e.target.value)
  return (
    <p className="control has-icons-left">
      <input
        className="input is-medium has-pink-border"
        type="text"
        placeholder="Search"
        value={filter}
        onChange={updateFilter}
      />
      <span className="icon is-left">
        <Icon filter={filter} reset={reset} />
      </span>
      <style jsx>{`
        .control.has-icons-left .icon {
          // bulma removes pointer events from icons
          pointer-events: initial;
        }
      `}</style>
    </p>
  )
}

export default OffersFilter
