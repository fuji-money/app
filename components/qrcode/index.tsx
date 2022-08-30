import React from 'react'
import { useQRCode } from 'next-qrcode'

interface QRCodeProps {
  text: string
}

function QRCode({ text }: QRCodeProps) {
  const { Canvas } = useQRCode()

  return (
    <Canvas
      text={text}
      options={{
        type: 'image/jpeg',
        quality: 0.3,
        level: 'M',
        margin: 0,
        scale: 4,
        width: 300,
        color: {
          dark: '#000',
          light: '#FFF',
        },
      }}
    />
  )
}

export default QRCode
