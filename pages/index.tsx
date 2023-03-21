import type { NextPage } from 'next'
import Image from 'next/image'
import Router from 'next/router'
import Script from 'next/script'

const Home: NextPage = () => {
  return (
    <section>
      <div className="is-flex is-flex-direction-column is-align-items-center">
        <p className="mt-6">
          <Image
            className="logo"
            src="/images/fuji-logo-128.png"
            alt="fuji logo"
            width="430"
            height="128"
          />
        </p>
        <p className="has-text-centered intro mt-6">
          Choose any link below to access the decentralized web app
        </p>
        <button className="button" onClick={() => Router.push('/dashboard')}>
          fuji.money
        </button>
        <button className="button" disabled>
          tryfuji.com
        </button>
        <button className="button" disabled>
          fujiapp.io
        </button>
      </div>
      <style jsx>{`
        .button {
          margin-bottom: 1rem;
          width: 420px;
        }
        .intro {
          color: #2c024d;
          display: inline-block;
          font-size: 1.5rem;
          font-weight: 400;
          margin: 1em auto;
          width: 420px;
        }
        .logo {
          display: block;
          margin: 80px auto;
        }
      `}</style>
      <Script
        defer
        data-domain="alpha-app.fuji.money"
        src="https://analytics.fuji.money/js/plausible.js"
        strategy="lazyOnload"
      />
    </section>
  )
}

export default Home
