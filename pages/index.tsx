import InvalidEmailModal from 'components/modals/invalidEmail'
import { setAuthCookie } from 'lib/auth'
import { postData } from 'lib/fetch'
import { openModal } from 'lib/utils'
import type { NextPage } from 'next'
import Image from 'next/image'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'

const Home: NextPage = () => {
  const router = useRouter()

  useEffect(() => {
    console.log('useEffect')
    const checkAuth = async () => {
      const validUser = await postData('/api/login/check', document.cookie)
      if (validUser) router.push('/dashboard')
    }
    checkAuth()
  })

  const handleSubmit = async (event: any) => {
    event.preventDefault()
    const email = event.target.email.value
    if (!email) return

    // check if email is valid, gets cookie value
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(email),
    })

    if (res.ok) {
      const cookie = await res.json()
      setAuthCookie(cookie)
      router.push('/dashboard')
    } else {
      console.log('Email not in short list')
      openModal('invalid-email-modal')
      // deleteCookie()
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
        <p className="intro mt-6">Get access to the Closed Beta</p>
        <form onSubmit={handleSubmit}>
          <input name="email" type="email" placeholder="me@email.com" />
          <br />
          <br />
          <button className="button is-primary">Enter</button>
        </form>
      </div>
      <InvalidEmailModal />
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
