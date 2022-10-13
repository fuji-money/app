import { ReactNode } from 'react'
import Image from 'next/image'

interface SomeErrorProps {
  children: ReactNode
}

const SomeError = ({ children }: SomeErrorProps) => {
  return (
    <p className="has-text-weight-bold has-text-centered my-6">{children}</p>
  )
}

interface SomethingWentWrongProps {
  error: string | unknown
  retry?: () => void
}

export const SomethingWentWrong = ({
  error,
  retry,
}: SomethingWentWrongProps) => {
  return (
    <div className="has-text-centered mx-6">
      <p>
        <Image
          src={`/images/status/failure.svg`}
          alt="status icon"
          height={100}
          width={100}
        />
      </p>
      <h2 className="mt-4">Something went wrong</h2>
      <p className="is-size-7 mt-4">{error}</p>
      {retry && (
        <p className="has-text-centered mt-5">
          <button className="button is-cta" onClick={retry}>
            Try again
          </button>
        </p>
      )}
    </div>
  )
}

export default SomeError
