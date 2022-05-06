import type { NextPage } from 'next'
import { useState } from 'react'
import Splash from 'components/multiply/splash'
import Multiply from 'components/multiply'
import { useRouter } from 'next/router'

const MultiplyAsset: NextPage = () => {
  const router = useRouter()
  const { asset } = router.query;
  const [advance, setAdvance] = useState(false)

  if (advance) return <Multiply asset={'xxx'} />
  return <Splash click={() => setAdvance(true)} />
}

export default MultiplyAsset

