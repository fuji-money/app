import React from 'react'
import { useQRCode } from 'next-qrcode'

interface QRCodeProps {
  text: string
  paid: boolean
}

function QRCode({ text, paid }: QRCodeProps) {
  const { Canvas } = useQRCode()
  const color = paid ? '#eee' : '#000'

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
          dark: color,
          light: '#FFF',
        },
      }}
    />
  )
}

export default QRCode
