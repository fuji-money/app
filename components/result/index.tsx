import Link from 'next/link'
import Image from 'next/image'
import ExplorerLink from 'components/links/explorer'
import TwitterLink from 'components/links/twitter'
import { twitterMessage } from 'lib/constants'
import { closeAllModals } from 'lib/utils'

interface SuccessProps {
  txid: string
}

const Success = ({ txid }: SuccessProps) => {
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
          <a
            className="button is-primary is-cta"
            onClick={() => closeAllModals()}
          >
            Back to dashboard
          </a>
        </Link>
      </p>
    </div>
  )
}

interface FailureProps {
  error: string | unknown
}

const Failure = ({ error }: FailureProps) => {
  const handleClick = () => window.location.reload()

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
        <button className="button is-cta" onClick={handleClick}>
          Try again
        </button>
      </p>
    </div>
  )
}

interface ResultProps {
  data: string
  result: string
}

const Result = ({ data, result }: ResultProps) => {
  if (result === 'success') return <Success txid={data} />
  if (result === 'failure') return <Failure error={data} />
  return <></>
}

export default Result
