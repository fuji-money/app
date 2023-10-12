import Image from 'next/image'
import Link from 'next/link'
import ConnectButton from 'components/buttons/connect'
import Settings from 'components/settings'

export default function Navbar() {
  return (
    <>
      <div className="container mt-2">
        <nav className="is-flex is-justify-content-space-between">
          <div>
            <Image
              alt="fuji logo"
              height={48}
              src="/images/fuji-logo-128.png"
              width={161.25}
            />
          </div>
          <div className="is-flex">
            <Link href="/dashboard">
              <a className="is-block my-auto">Dashboard</a>
            </Link>
            <a
              className="is-block my-auto ml-5"
              href="https://trade.fuji.money"
              target="_blank"
              rel="noreferrer"
            >
              Trade
            </a>
            <Link href="/borrow">
              <a className="is-block my-auto ml-5">Mint</a>
            </Link>
            <Link href="/multiply">
              <a className="is-block my-auto ml-5 mr-5">Multiply</a>
            </Link>
            <ConnectButton />
            <Settings />
          </div>
          <style jsx>{`
            a {
              color: #6b1d9c;
              font-weight: 700;
            }
            .mr-long {
              margin-right: 9rem;
            }
          `}</style>
        </nav>
      </div>
    </>
  )
}
