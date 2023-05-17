import Image from 'next/image'
import { ReactNode } from 'react'

interface EmptyStateProps {
  children: ReactNode
}

const EmptyState = ({ children }: EmptyStateProps) => {
  return (
    <div className="empty-state is-box has-pink-border">
      <div className="cloud-1">
        <Image
          src="/images/cloud-1.svg"
          alt="cloud image"
          className="cloud-1"
          height={100}
          width={100}
        />
      </div>
      <p>{children}</p>
      <div className="cloud-2">
        <Image
          src="/images/cloud-2.svg"
          alt="cloud image"
          height={100}
          width={100}
        />
      </div>
      <style jsx>{`
        .empty-state {
          background-color: #fefefe;
        }
        p {
          color: #94227d;
          font-weight: 700;
          text-align: center;
        }
        .cloud-1 {
        }
        .cloud-2 {
          text-align: right;
        }
      `}</style>
    </div>
  )
}

export default EmptyState
