import { postData } from 'lib/fetch'
import { useRouter } from 'next/router'
import { ReactNode, useEffect, useState } from 'react'

interface AuthProps {
  children: ReactNode
}

export default function Auth({ children }: AuthProps) {
  const router = useRouter()
  const [validUser, setValidUser] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const valid = await postData('/api/login/check', document.cookie)
        if (!valid) router.push('/')
        setValidUser(valid)
      } catch (err: any) {
        router.push('/')
        console.error(err)
      }
    }
    if (typeof document === 'undefined' || !document.cookie) router.push('/')
    checkAuth()
  })

  if (validUser) return <>{children}</>
  return <></>
}
