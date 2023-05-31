import Image from 'next/image'

interface IconProps {
  type: string
}

const Icon = ({ type }: IconProps) => {
  const src = type === 'danger' ? 'exception' : 'warning'
  return (
    <span className="icon-container">
      <Image
        src={`/images/icons/${src}.svg`}
        alt={`${src} icon`}
        height="16"
        width="16"
      />
      <style jsx>{`
        .icon-container {
          height: 1rem;
          margin: auto 0.5rem;
          margin-left: 0;
          position: relative;
          top: 3px;
        }
      `}</style>
    </span>
  )
}

interface NotificationProps {
  label: string
  type: string
}

const Notification = ({ label, type }: NotificationProps) => {
  return (
    <p className={`${type} is-size-7`}>
      <Icon type={type} />
      {label}
      <style jsx>{`
        p {
          border-radius: 3px;
          margin-bottom: 1rem;
          padding: 0.5rem;
        }
        .warning {
          background-color: #ffe8d3;
          border: 1px solid #ff712c;
          color: #ff712c;
        }
        .danger {
          background-color: #ffdedf;
          border: 1px solid #f18c95;
          color: #e34800;
        }
      `}</style>
    </p>
  )
}

export default Notification
