import type { NextPage } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/router'

const Home: NextPage = () => {
  const router = useRouter()
  if (typeof window !== 'undefined') router.push('/dashboard')

  return <></> // TODO

  return (
    <section>
      <div className="has-text-centered">
        <p className="mt-6">
          <Image
            className="logo"
            src="/images/fuji-logo-128.png"
            alt="fuji logo"
            width="430"
            height="128"
          />
        </p>
        <p className="links-intro">
          Choose any link below to access the decentralized web app
        </p>
        <div className="links-wrapper">
          <p>
            <Link href="/dashboard">
              <a>fuji.money</a>
            </Link>
          </p>
          <p>
            <a href="https://tryfuji.com">tryfuji.com</a>
          </p>
          <p>
            <a href="https://fujiapp.io">fujiapp.io</a>
          </p>
        </div>
      </div>

      <style jsx>{`
        .links-intro {
          color: #2c024d;
          display: inline-block;
          font-size: 1.5rem;
          font-weight: 400;
          margin: auto;
          max-width: 500px;
        }
        .logo {
          display: block;
          margin: 80px auto;
        }
      `}</style>
    </section>
  )
}

export default Home
