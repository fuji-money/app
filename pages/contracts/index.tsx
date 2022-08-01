import type { NextPage } from 'next'
import Contracts from 'components/contracts'
import Result from 'components/result'
import { useState } from 'react'

const ContractsPage: NextPage = () => {
  const [result, setResult] = useState('')
  const [data, setData] = useState<any>()

  if (result)
    return (
      <Result
        data={data}
        result={result}
        setData={setData}
        setResult={setResult}
      />
    )

  return <Contracts setData={setData} setResult={setResult} />
}

export default ContractsPage
