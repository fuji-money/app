import { ReactNode } from 'react'

interface SomeErrorProps {
  children: ReactNode
}

const SomeError = ({ children }: SomeErrorProps) => {
  return (
    <p className="has-text-weight-bold has-text-centered my-6">{children}</p>
  )
}

export default SomeError
