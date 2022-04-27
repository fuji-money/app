import type { NextPage } from 'next'
import { useState } from 'react'
import Splash from 'components/multiply/splash'
import Form from 'components/multiply/form'

const Multiply: NextPage = () => {
  const [showForm, setShowForm] = useState(false)

  if (showForm) return <Form />
  return <Splash click={() => setShowForm(true)} />
}

export default Multiply

