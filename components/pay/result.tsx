import Link from 'next/link'
import Image from 'next/image'
import { Contract } from 'lib/types'

const Success = () => {
  return (
    <div className="has-text-centered mx-6">
      <p>
        <Image
          src={`/images/status/success.svg`}
          alt="status icon"
          height={100}
          width={100}
        />
      </p>
      <h2 className="mt-4">Success</h2>
      <p className="is-size-7 has-text-left">
        In vivamus mi pretium pharetra cursus lacus, elit. Adipiscing eget vel
        ut non duis vitae. Augue mi, bibendum ac imperdiet ipsum sed ornare.
        Facilisis id sem quam elementum euismod ante ut. Ac, pharetra elit, sit
        pharetra a. Eu diam nunc nulla risus arcu, integer nulla diam, est. Nisl
        accumsan potenti mattis consectetur pellentesque.
      </p>
      <p className="has-text-centered mt-4">
        <Link href="/dashboard">
          <a className="button is-primary is-cta">Back to dashboard</a>
        </Link>
      </p>
    </div>
  )
}

const Failure = () => {
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
      <p className="is-size-7 has-text-left">
        In vivamus mi pretium pharetra cursus lacus, elit. Adipiscing eget vel
        ut non duis vitae. Augue mi, bibendum ac imperdiet ipsum sed ornare.
        Facilisis id sem quam elementum euismod ante ut. Ac, pharetra elit, sit
        pharetra a. Eu diam nunc nulla risus arcu, integer nulla diam, est. Nisl
        accumsan potenti mattis consectetur pellentesque.
      </p>
      <p className="has-text-centered mt-4">
        <a className="button is-primary is-cta">Retry payment</a>
      </p>
      <p className="has-text-centered mt-4">
        <Link href="/dashboard">
          <a className="button is-cta">Back to dashboard</a>
        </Link>
      </p>
    </div>
  )
}

interface ResultProps {
  contract: Contract
  result: string
}

const Result = ({ contract, result }: ResultProps) => {
  if (result === 'success') return <Success />
  if (result === 'failure') return <Failure />
  return <></>
}

export default Result
