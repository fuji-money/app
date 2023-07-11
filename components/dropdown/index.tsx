import classNames from 'classnames'
import React from 'react'

export type DropDownProps = {
  title: string
  options: {
    value: string
    onClick: () => Promise<void>
  }[]
}

const DropDown: React.FC<DropDownProps> = ({ title, options }) => {
  const [isActive, setIsActive] = React.useState(false)

  return (
    <div className={classNames('dropdown', { 'is-active': isActive })}>
      <div className="dropdown-trigger">
        <button
          className="button"
          onClick={() => setIsActive(!isActive)}
          aria-haspopup="true"
          aria-controls="dropdown-menu"
        >
          <span>{title}</span>
          <span className="icon is-small">
            <i className="fas fa-angle-down" aria-hidden="true"></i>
          </span>
        </button>
      </div>
      <div className="dropdown-menu" id="dropdown-menu" role="menu">
        <div className="dropdown-content">
          {options.map((option, index) => (
            <a
              key={index}
              href="#"
              className="dropdown-item"
              onClick={() => {
                setIsActive(false)
                return option.onClick()
              }}
            >
              {option.value}
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}

export default DropDown
