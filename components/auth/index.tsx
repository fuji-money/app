import { userNotAllowed } from 'lib/auth'
import { fetchURL, postData } from 'lib/fetch'
import { useRouter } from 'next/router'
import { ReactNode, useEffect } from 'react'

interface AuthProps {
  children: ReactNode
}

export default function Auth({ children }: AuthProps) {
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      const validUser = await postData('/api/login/check', document.cookie)
      if (!validUser) router.push('/')
    }
    if (typeof document === 'undefined' || !document.cookie) router.push('/')
    checkAuth()
  })

  return <>{children}</>
}
