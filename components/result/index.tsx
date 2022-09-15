import Link from 'next/link'
import Image from 'next/image'
import ExplorerLink from 'components/links/explorer'
import TwitterLink from 'components/links/twitter'
import { twitterMessage } from 'lib/constants'
import { closeAllModals } from 'lib/utils'

interface SuccessProps {
  txid: string
  reset: () => void
}

const Success = ({ reset, txid }: SuccessProps) => {
  const handleClick = () => {
    closeAllModals()
    reset()
  }
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
      <h2 className="mt-4 mb-4">Success</h2>
      <ExplorerLink txid={txid} />
      &nbsp;
      <TwitterLink message={twitterMessage} />
      <p className="has-text-centered mt-5">
        <Link href="/dashboard">
          <a className="button is-primary is-cta" onClick={handleClick}>
            Back to dashboard
          </a>
        </Link>
      </p>
    </div>
  )
}

interface FailureProps {
  error: string | unknown
  reset: () => void
}

const Failure = ({ error, reset }: FailureProps) => {
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
        <button className="button is-cta" onClick={reset}>
          Try again
        </button>
      </p>
    </div>
  )
}

interface ResultProps {
  data: string
  result: string
  reset: () => void
}

const Result = ({ data, result, reset }: ResultProps) => {
  if (result === 'success') return <Success reset={reset} txid={data} />
  if (result === 'failure') return <Failure reset={reset} error={data} />
  return <></>
}

export default Result
