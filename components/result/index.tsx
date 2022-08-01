import Link from 'next/link'
import Image from 'next/image'
import ExplorerLink from 'components/links/explorer'
import TwitterLink from 'components/links/twitter'
import { twitterMessage } from 'lib/constants'

const Success = ({ cleanUp, txid }: { cleanUp: any; txid: any }) => {
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

const Failure = ({ cleanUp, error }: { cleanUp: any; error: any }) => {
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
        <button
          className="button is-cta"
          onClick={() => window.location.reload()}
        >
          Try again
        </button>
      </p>
    </div>
  )
}

interface ResultProps {
  data: any
  result: string
  setData: any
  setResult: any
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
