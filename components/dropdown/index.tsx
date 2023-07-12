import classNames from 'classnames'
import Image from 'next/image'
import React from 'react'

export type DropDownProps = {
  title: string
  options: {
    isActive: boolean
    value: string
    icon: string
    onClick: () => Promise<void>
  }[]
}

const DropDown: React.FC<DropDownProps> = ({ title, options }) => {
  const [isActive, setIsActive] = React.useState(false)

  return (
    <div className={classNames('dropdown', { 'is-active': isActive })}>
      <div className="dropdown-trigger">
        <button
          className="button is-primary"
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
              className={classNames('dropdown-item', {
                'is-active': option.isActive,
              })}
              onClick={() => {
                setIsActive(false)
                return option.onClick()
              }}
            >
              <div className="is-flex is-justify-content-center	is-align-content-space-between">
                <span className="mr-2">
                  <Image
                    src={option.icon}
                    alt={`${option.value} logo`}
                    width={20}
                    height={20}
                  />
                </span>
                <span className="is-size-6 has-text-centered">
                  {option.value}
                </span>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}

export default DropDown
