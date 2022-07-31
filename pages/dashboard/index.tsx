import type { NextPage } from 'next'
import Script from 'next/script'
import Activities from 'components/activities'
import Assets from 'components/assets'
import Contracts from 'components/contracts'
import { useState } from 'react'
import Result from 'components/result'

const Dashboard: NextPage = () => {
  const [result, setResult] = useState('')
  const [data, setData] = useState<any>()

  if (result) return <Result data={data} result={result} setData={setData} setResult={setResult} />

  return (
    <>
      <Assets />
      <div className="vertical-space"></div>
      <Contracts setData={setData} setResult={setResult}/>
      <div className="vertical-space"></div>
      <Activities />
      <style jsx>{`
        div.vertical-space {
          min-height: 3rem;
        }
      `}</style>
      <Script defer data-domain="alpha-app.fuji.money" src="https://analytics.fuji.money/js/plausible.js" strategy="lazyOnload" />
    </>
  )
}

export default Dashboard
