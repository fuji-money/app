import type { NextPage } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/router'

const Home: NextPage = () => {
  const router = useRouter()
  const handleSubmit = async (event: any) => {
    event.preventDefault()

    const email = event.target.email.value

    // Once we have the did from magic, login with our own API
    const authRequest = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(email),
    })

    console.log('page index authRequest', authRequest.status)
    if (authRequest.ok) {
      // We successfully logged in, our API
      // set authorization cookies and now we
      // can redirect to the dashboard!
      router.push('/dashboard')
    } else {
      console.log('Email not in short list')
    }
  }

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
        <p className="intro">Login with your email</p>
        <form onSubmit={handleSubmit}>
          <input name="email" type="email" placeholder="me@email.com" />
          <br />
          <br />
          <button className="button is-primary">Log in</button>
        </form>
      </div>

      <style jsx>{`
        input {
          border: 2px solid #88389d;
          border-radius: 96px;
          color: #88389d;
          line-height: inherit;
          min-width: 200px;
          padding: 10px;
        }
        .links-.intro {
          color: #2c024d;
          display: inline-block;
          font-size: 1.2rem;
          font-weight: 400;
          margin: 1em auto;
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
