import Link from 'next/link'
import Image from 'next/image'
import ExplorerLink from 'components/links/explorer'
import TwitterLink from 'components/links/twitter'
import { twitterMessage } from 'lib/constants'
import { closeAllModals } from 'lib/utils'
import { Contract, Outcome } from 'lib/types'
import { Tasks } from 'lib/tasks'
import { prettyAsset, prettyNumber } from 'lib/pretty'
import { getContractRatio } from 'lib/contracts'
import { SomethingWentWrong } from 'components/layout/error'

interface SuccessProps {
  contract: Contract
  reset: () => void
  task: string
  txid: string
}

const Success = ({ contract, reset, task, txid }: SuccessProps) => {
  const handleClick = () => {
    closeAllModals()
    reset()
  }
  // Twitter message
  // TODO - use this instead of default twitterMessage from lib/constants
  const message = () => {
    const op = {
      [Tasks.Borrow]: 'Borrowed',
      [Tasks.Redeem]: 'Closed',
      [Tasks.Topup]: 'Topup',
    }[task]
    const collateral = `${prettyAsset(contract.collateral)} collateral`
    const synthetic = prettyAsset(contract.synthetic, 0, 0)
    const ratio = `${prettyNumber(getContractRatio(contract), 0, 0)}% ratio`
    return `${op} a contract ${synthetic} with ${collateral} at ${ratio}`
  }
  // console.info('message', message())
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
  retry: () => void
}

const Failure = ({ error, retry }: FailureProps) => {
  return <SomethingWentWrong error={error} retry={retry} />
}

interface ResultProps {
  contract: Contract
  data: string
  result: string
  retry: () => void
  reset: () => void
  task: string
}

const Result = ({
  contract,
  data,
  result,
  retry,
  reset,
  task,
}: ResultProps) => {
  if (result === Outcome.Success)
    return <Success contract={contract} reset={reset} task={task} txid={data} />
  if (result === Outcome.Failure) return <Failure retry={retry} error={data} />
  return <></>
}

export default Result
