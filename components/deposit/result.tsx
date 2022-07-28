import Link from 'next/link'
import Image from 'next/image'

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
      <p className="has-text-centered mt-5">
        <Link href="/dashboard">
          <a className="button is-primary is-cta">Back to dashboard</a>
        </Link>
      </p>
    </div>
  )
}

const Failure = ({ error }: { error: any }) => {
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
      <p className="is-size-7 mt-4">{`${error}`}</p>
      <p className="has-text-centered mt-5">
      <button className="button is-cta" onClick={() => window.location.reload()}>Try again</button>
      </p>
    </div>
  )
}

interface ResultProps {
  error: any
  result: string
}

const Result = ({ error, result }: ResultProps) => {
  if (result === 'success') return <Success />
  if (result === 'failure') return <Failure error={error} />
  return <></>
}

export default Result
