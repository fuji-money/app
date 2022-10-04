import { useRouter } from 'next/router'

function NotAllowed() {
  const router = useRouter()
  setTimeout(() => {
    router.push('/dashboard')
  }, 1000)
  return (
    <>
      <p>Operation not allowed, redirecting to dashboard</p>
    </>
  )
}

export default NotAllowed
