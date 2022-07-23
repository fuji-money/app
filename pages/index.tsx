import type { NextPage } from 'next'
import Image from 'next/image'
import Link from 'next/link'

const Home: NextPage = () => {
  const handleSubmit = async (event: any) => {
    event.preventDefault();

    const { elements } = event.target;

    // Add the Magic code here

    // Once we have the token from magic,
    // update our own database

    // const authRequest = await fetch()

    // if (authRequest.ok) {
    // We successfully logged in, our API
    // set authorization cookies and now we
    // can redirect to the dashboard!
    // router.push('/dashboard')
    // } else { /* handle errors */ }
  };

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
          Welcome to the Fuji.Money closed beta
        </p>
        <div className="links-wrapper">
          <div className="columns">
            <div className="column is-4 is-offset-4">
              <form className="form" onSubmit={handleSubmit}>
                <label className="label" htmlFor="email">Email</label>
                <input className="input is-large" type="email" placeholder="Email"></input>
              </form>
              <button className="button">Log in</button>
            </div>
          </div>

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
