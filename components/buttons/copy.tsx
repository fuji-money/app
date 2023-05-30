import { useState } from 'react'
import { sleep } from 'lib/utils'

const CopyButton = ({ text }: { text: string }) => {
  const [buttonText, setButtonText] = useState('Copy')

  const handleClick = () => {
    navigator.clipboard.writeText(text).then(() => {
      setButtonText('Copied')
      sleep(2000).then(() => setButtonText('Copy'))
    })
  }

  return (
    <>
      <button onClick={handleClick}>{buttonText}</button>
      <style jsx>{`
        button {
          background-color: #f18c95;
          border: 0;
          border-radius: 50px;
          color: #fff;
          cursor: pointer;
          min-width: 4rem;
          padding: 4px 0;
          position: relative;
          top: -2px;
        }
      `}</style>
    </>
  )
}

export default CopyButton
