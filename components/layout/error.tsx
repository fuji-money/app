import { ReactNode } from 'react'

interface SomeErrorProps {
  children: ReactNode
}

const SomeError = ({ children }: SomeErrorProps) => {
  return <p>{children}</p>
}

export default SomeError
