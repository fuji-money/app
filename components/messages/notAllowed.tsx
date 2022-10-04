import Router from 'next/router'

function NotAllowed() {
  setTimeout(() => {
    Router.push('/dashboard')
  }, 2000)
  return (
    <>
      <p>Operation not allowed, redirecting to dashboard</p>
    </>
  )
}

export default NotAllowed
