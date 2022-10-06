import SomeError from 'components/layout/error'
import Router from 'next/router'

function NotAllowed() {
  setTimeout(() => {
    Router.push('/dashboard')
  }, 2000)
  return <SomeError>Operation not allowed, redirecting to dashboard</SomeError>
}

export default NotAllowed
