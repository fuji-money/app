import React from 'react'
import { useQRCode } from 'next-qrcode'

function QRCode({ text }: { text: string }) {
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
