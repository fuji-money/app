import Link from 'next/link'
import Image from 'next/image'
import ExplorerLink from 'components/links/explorer'
import TwitterLink from 'components/links/twitter'
import { twitterMessage } from 'lib/constants'

interface SuccessProps {
  cleanUp: () => void
  txid: string
}

const Success = ({ cleanUp, txid }: SuccessProps) => {
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
          <a className="button is-primary is-cta" onClick={cleanUp}>
            Back to dashboard
          </a>
        </Link>
      </p>
    </div>
  )
}

interface FailureProps {
  cleanUp: () => void
  error: string | unknown
}

const Failure = ({ cleanUp, error }: FailureProps) => {
  const handleClick = () => {
    cleanUp()
    window.location.reload()
  }
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
  setData: (arg0: string) => void
  setResult: (arg0: string) => void
}

const Result = ({ data, result, setData, setResult }: ResultProps) => {
  const cleanUp = () => {
    setData('')
    setResult('')
  }
  if (result === 'success') return <Success cleanUp={cleanUp} txid={data} />
  if (result === 'failure') return <Failure cleanUp={cleanUp} error={data} />
  return <></>
}

export default Result
