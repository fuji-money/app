import { useQRCode } from 'next-qrcode'
import Image from 'next/image'

interface QRCodeProps {
  text: string
}

function QRCode({ text }: QRCodeProps) {
  const { Canvas } = useQRCode()

  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      const div = document.getElementById('div')
      if (!div) return
      div.style.background = `#eee`
      setTimeout(() => {
        div.style.background = `#fefefe`
      }, 210)
    })
  }

  return (
    <>
      <Canvas
        text={text}
        options={{
          type: 'image/jpeg',
          quality: 0.3,
          errorCorrectionLevel: 'M',
          margin: 0,
          scale: 4,
          width: 300,
          color: {
            dark: '#000000',
            light: '#ffffff',
          },
        }}
      />
      <div
        id="div"
        className="has-pink-border is-flex is-size-7"
        onClick={handleCopy}
      >
        <p className="has-text-weight-bold my-auto mr-2">Payment&nbsp;ID:</p>
        <p className="has-text-weight-bold my-auto is-gradient overflow mr-2">
          {text}
        </p>
        <p className="my-auto pt-1">
          <Image
            src="/images/icons/copy.svg"
            height={20}
            width={20}
            alt="copy icon"
          />
        </p>
      </div>
      <style jsx>{`
        div {
          background: #fefefe;
          margin: 0 auto;
          padding: 0 8px;
          max-width: 300px;
        }
        p:nth-child(3) {
          min-width: 20px;
        }
        .overflow {
          overflow: hidden;
          text-overflow: ellipsis;
        }
      `}</style>
    </>
  )
}

export default QRCode
